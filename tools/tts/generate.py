"""
Records every line the app speaks, in a calm, natural female voice.

Two engines (pick one):
  parler  AI4Bharat Indic Parler-TTS, open source, runs on this PC's GPU.
          Voices "Jaya" (Tamil) and "Mary" (Indian English), steered by a text description.
          One-time setup: accept the model terms at https://huggingface.co/ai4bharat/indic-parler-tts
          and log in with `.venv/Scripts/huggingface-cli login` (your own token).
  azure   Microsoft Azure neural voices ta-IN-PallaviNeural, en-IN-NeerjaNeural, hi-IN-SwaraNeural,
          te-IN-ShrutiNeural and kn-IN-SapnaNeural.
          Needs your own Speech key: set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION first.
          The free tier (F0) easily covers these few dozen short lines.

Usage (from tools/tts):
    (in app/)  npm run voice:lines                         -> writes lines.json
    .venv/Scripts/python generate.py --engine azure         -> app/public/voice/{ta,en}/*.mp3 + manifest.json
    .venv/Scripts/python generate.py --engine parler --only f3b39947b86d --force   -> redo one line

Keys and tokens are only read from your environment; nothing secret is written into the app.
"""
import argparse
import json
import os
import subprocess
import sys
import time
import urllib.request
from pathlib import Path
from xml.sax.saxutils import escape

os.environ.setdefault("HF_HOME", r"D:\hf-cache")  # model cache on D: (C: is nearly full)

HERE = Path(__file__).parent
OUT = HERE.parent.parent / "app" / "public" / "voice"

# Rough speaking speed, used to catch broken takes (mumbling, long silences, cut-offs).
SECONDS_PER_CHAR = {"ta": 0.085, "en": 0.065, "hi": 0.07, "te": 0.085, "kn": 0.085}


def post_process(src: Path, mp3: Path) -> float:
    """Trim silence, even out loudness, soft fade, encode to small mono MP3. Returns seconds."""
    af = (
        "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08,"
        "areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.12,areverse,"
        "highpass=f=70,loudnorm=I=-19:TP=-2:LRA=7,"
        "afade=t=in:d=0.03"
    )
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", str(src), "-af", af, "-ac", "1", "-ar", "44100", "-b:a", "64k", str(mp3)],
        check=True,
    )
    probe = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(mp3)],
        capture_output=True, text=True, check=True,
    )
    return float(probe.stdout.strip())


# ---------------------------------------------------------------- engines

class Parler:
    MODEL = "ai4bharat/indic-parler-tts"
    QUALITY = ("The recording is of very high quality, with the speaker's voice sounding clear and very close up, "
               "with no background noise.")
    DESCRIPTIONS = {
        "ta": "Jaya speaks in a calm, soothing and warm voice at a slightly slow pace, gentle and friendly. " + QUALITY,
        "en": "Mary speaks in a calm, soothing and warm voice at a slightly slow pace, gentle and friendly, "
              "with an Indian English accent. " + QUALITY,
        "hi": "Divya speaks in a calm, soothing and warm voice at a slightly slow pace, gentle and friendly. " + QUALITY,
        "te": "Lalitha speaks in a calm, soothing and warm voice at a slightly slow pace, gentle and friendly. " + QUALITY,
        "kn": "Anu speaks in a calm, soothing and warm voice at a slightly slow pace, gentle and friendly. " + QUALITY,
    }

    def __init__(self):
        import torch
        from parler_tts import ParlerTTSForConditionalGeneration
        from transformers import AutoTokenizer, set_seed
        self.torch, self.set_seed = torch, set_seed
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        dtype = torch.bfloat16 if self.device == "cuda" else torch.float32
        print(f"loading {self.MODEL} on {self.device} ({dtype})", flush=True)
        self.model = ParlerTTSForConditionalGeneration.from_pretrained(self.MODEL, torch_dtype=dtype).to(self.device)
        self.tok = AutoTokenizer.from_pretrained(self.MODEL)
        desc_tok = AutoTokenizer.from_pretrained(self.model.config.text_encoder._name_or_path)
        self.desc = {lang: desc_tok(d, return_tensors="pt").to(self.device) for lang, d in self.DESCRIPTIONS.items()}
        self.rate = self.model.config.sampling_rate

    def render(self, text: str, lang: str, attempt: int, out: Path) -> None:
        import soundfile as sf
        self.set_seed(1000 + attempt)
        prompt = self.tok(text, return_tensors="pt").to(self.device)
        with self.torch.no_grad():
            audio = self.model.generate(
                input_ids=self.desc[lang].input_ids, attention_mask=self.desc[lang].attention_mask,
                prompt_input_ids=prompt.input_ids, prompt_attention_mask=prompt.attention_mask,
            )
        sf.write(out, audio.to(self.torch.float32).cpu().numpy().squeeze(), self.rate, format="WAV")


class Azure:
    VOICES = {"ta": ("ta-IN", "ta-IN-PallaviNeural"), "en": ("en-IN", "en-IN-NeerjaNeural"),
              "hi": ("hi-IN", "hi-IN-SwaraNeural"), "te": ("te-IN", "te-IN-ShrutiNeural"), "kn": ("kn-IN", "kn-IN-SapnaNeural")}

    def __init__(self):
        self.key = os.environ.get("AZURE_SPEECH_KEY")
        self.region = os.environ.get("AZURE_SPEECH_REGION")
        if not self.key or not self.region:
            sys.exit("Set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION (e.g. centralindia) in your terminal first.")

    def render(self, text: str, lang: str, attempt: int, out: Path) -> None:
        locale, voice = self.VOICES[lang]
        # Slightly slower and softer than default = calmer.
        ssml = (f"<speak version='1.0' xml:lang='{locale}'><voice name='{voice}'>"
                f"<prosody rate='-8%' pitch='-2%'>{escape(text)}</prosody></voice></speak>")
        req = urllib.request.Request(
            f"https://{self.region}.tts.speech.microsoft.com/cognitiveservices/v1",
            data=ssml.encode("utf-8"),
            headers={
                "Ocp-Apim-Subscription-Key": self.key,
                "Content-Type": "application/ssml+xml",
                "X-Microsoft-OutputFormat": "riff-24khz-16bit-mono-pcm",
                "User-Agent": "GoScheme-voice-generator",
            },
        )
        with urllib.request.urlopen(req, timeout=60) as res:
            out.write_bytes(res.read())


# ---------------------------------------------------------------- main

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--engine", choices=["parler", "azure"], default="parler")
    ap.add_argument("--force", action="store_true", help="re-record lines that already have audio")
    ap.add_argument("--only", nargs="*", help="line ids to record")
    ap.add_argument("--langs", nargs="*", help="only these languages, e.g. --langs hi te kn")
    args = ap.parse_args()

    all_lines = json.loads((HERE / "lines.json").read_text(encoding="utf-8"))
    lines = [l for l in all_lines if (not args.only or l["id"] in args.only) and (not args.langs or l["lang"] in args.langs)]
    engine = Parler() if args.engine == "parler" else Azure()
    tmp = HERE / "tmp.wav"

    report = []
    for i, line in enumerate(lines, 1):
        lang, text, lid = line["lang"], line["text"], line["id"]
        mp3 = OUT / lang / f"{lid}.mp3"
        mp3.parent.mkdir(parents=True, exist_ok=True)
        if mp3.exists() and not args.force:
            print(f"[{i}/{len(lines)}] skip {lid} (exists)", flush=True)
            continue
        expected = max(1.0, len(text) * SECONDS_PER_CHAR[lang])
        ok, secs = False, 0.0
        for attempt in range(4 if args.engine == "parler" else 1):
            t0 = time.time()
            engine.render(text, lang, attempt, tmp)
            secs = post_process(tmp, mp3)
            ratio = secs / expected
            ok = 0.45 <= ratio <= 1.9
            print(f"[{i}/{len(lines)}] {lang} {lid} try {attempt + 1}: {secs:.1f}s (x{ratio:.2f} of expected) "
                  f"in {time.time() - t0:.0f}s {'OK' if ok else 'check'} | {text}", flush=True)
            if ok:
                break
        report.append({"id": lid, "lang": lang, "seconds": round(secs, 2), "ok": ok})

    # Manifest of every clip on disk that matches a current line.
    manifest = {f"{l['lang']}|{l['text']}": f"{l['lang']}/{l['id']}.mp3"
                for l in all_lines if (OUT / l["lang"] / f"{l['id']}.mp3").exists()}
    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8")
    tmp.unlink(missing_ok=True)
    bad = [r["id"] for r in report if not r["ok"]]
    print(f"done: {len(manifest)} clips in manifest; {len(bad)} to listen to: {bad}", flush=True)


if __name__ == "__main__":
    main()
