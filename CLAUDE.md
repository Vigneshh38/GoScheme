# GoScheme — Government Scheme Discovery Assistant (PS 13)

Project name: **GoScheme** (earlier working name "Scheme Saathi" — do not use it anymore).
Team: **Techies** — Vignesh A, Musthaba S, Mohammed AlHameed. CresIgnite CSE Project Expo 2K26,
Crescent Institute. Expo deck: GoScheme_Expo.pptx; team logo + UI mockups in mockups/.

Voice-first app (Tamil, English, Hindi, Telugu, Kannada) that tells people which government schemes they
are eligible for and helps them fill the forms. MUST be very simple to use.

Pitch: "myScheme tells you, Haqdarshak does it for a fee, we do it free with AI."

## Phase 1 scope (build this first)
Voice onboarding → Home page with matching schemes.

1. Choose language (Tamil / English)
2. One question at a time, spoken aloud (TTS) + shown as text
3. Questions: name, age, gender, occupation, annual income, district, family size
4. Clear + valid answer → sentence shows in GREEN, slides out, next question appears
5. Unclear voice (low STT confidence) or invalid answer → circle turns RED with a
   small shake, ask the same question again
6. After 2 failed tries → show tap buttons / text box as backup
7. Confirm screen: show all answers, editable
8. Home page: scheme cards matching the user, best match first (10 dummy schemes for now)
   - Three eligibility states:
     - "Eligible ✅"
     - "Maybe eligible — answer 1 more question" (profile is missing a field the rule needs)
     - "Not eligible, because…" + what to fix

### Family members
The app applies for anyone in the family, not just the phone owner. Ask
"Who is this for?" (self / spouse / child / parent / other) and keep one
profile per family member. Match schemes against every profile, since many
benefits go to a specific member (child's scholarship, parent's pension,
woman head of family).

### Consent & disclaimer
- Consent screen before collecting any personal data (DPDP Act 2023): what is
  collected, why, that it stays on the device, and how to delete it
- Always visible: "Not an official government app" + link to the official source
  for every scheme

### UI style
- Fully white background, clean, modern, Poppins font
- Center: soft animated circle like ChatGPT voice mode, pulsing while listening
- Smooth animations throughout

## CORE FEATURE: Auto-fill forms
When user taps a scheme:
1. Rule engine loads that scheme's required fields
   (each field has a source: profile / document / voice)
2. Fill fields from onboarding profile
3. If a field needs a document (passport, Aadhaar, ration card, income cert):
   - Ask user to take a photo
   - OCR extracts the required text → fill fields
   - Delete photo after extraction
4. If a small field is missing (pincode, parent's name) → ask by voice
5. Review screen: user checks and edits all fields
6. Output: ready-filled PDF + list of documents to carry

Rules:
- Show only masked Aadhaar (last 4 digits)
- Encrypt sensitive data, keep on device where possible
- Always confirm OCR text with the user

## Later phases
- Done: application status tracking (Ready → Submitted → Approved / Rejected) with a
  30-day "check the status" reminder (phone notification + banner) — `src/lib/reminders.ts`
- Alerts for new matching schemes (needs a server / scheme feed)
- Private schemes (start with govt schemes from myScheme data)

## Constraints
- Android app: opens the official portal in-app and auto-fills it (PM-KISAN, e-Shram, Tamizh Pudhalvan + Pudhumai Penn via UMIS login so far —
  `src/portal/portals.ts`). The user types captcha/OTP; our "Continue" bar then presses the
  portal's own Get OTP / Submit button. Other schemes (and the web version): ready-filled PDF
- Captcha / OTP: guide the user through it, never bypass or auto-fill
- Full Aadhaar / bank account live only in memory (`src/lib/secrets.ts`), never stored
- No paid middleman / agent step

## Target users
Everyone — not a specific group. Scheme data and onboarding must cover all
categories (farmers, students, women, seniors, workers, etc.), and the UI must
work for low-literacy and first-time smartphone users.

## App (decided 2026-09-29: React web app, mobile-first PWA)
Code in `app/` — React 19 + Vite + TypeScript, framer-motion, lucide-react. Deck slide 3 shows
`mockups/architecture.html` (re-render the PNG with headless Edge at 1160×500, scale 3).
- `npm run dev` (in app/) → http://localhost:5173 · `npm run dev:phone` → HTTPS on the LAN
  (phones only allow the mic on HTTPS) · `npm run build` · `npm run typecheck`
- `npm run build:artifact` → dist-artifact/ (single inlined page + voice clips) for the phone
  Artifact https://claude.ai/artifact/Ke5uJfhN2r3CAPJZvgcquK — republish after changes. In the
  artifact the mic and printing are blocked (type/tap answers, "Copy details" instead of PDF).
- Voice input: browser SpeechRecognition (ta-IN / en-IN) — Chrome or Edge, needs internet
- Screens in `src/screens`, schemes + rules in `src/data/schemes.ts`, questions in
  `src/data/questions.ts`, answer parsing (Tamil/English numbers, lakh, districts) in `src/lib/parse.ts`
- Data is AES-GCM encrypted in the browser (`src/lib/store.ts`); Aadhaar kept as last 4 digits only
- OCR: tesseract.js, fully offline — engine + English data are copied into `public/tesseract`
  by `scripts/copy-ocr-assets.mjs` before each build (not committed); PDF = print page ("Save as PDF") so Tamil renders correctly

### Android app (Capacitor 8, appId in.techies.goscheme)
- `npm run android` (in app/) → web build + `cap sync` + debug APK at
  `android/app/build/outputs/apk/debug/app-debug.apk` (copied to `GoScheme.apk` in the root)
- Set `GRADLE_USER_HOME=D:\gradle-cache` first (C: is nearly full); SDK path is in android/local.properties
- Portal filling: @capgo/inappbrowser injects `src/portal/autofill.ts` on every page load
- "Try with demo data" (UMIS schemes): opens the bundled demo copy `public/demo/umis.html`
  full-screen and runs the same fill script — works offline, for the expo demo

### Languages
All five are live: Tamil, English, Hindi, Telugu, Kannada. English + Tamil text sits inline as
{ en, ta }; Hindi / Telugu / Kannada come from `src/lang/*.json` keyed by the English text —
`npm run lang:check` must report "every language complete" after any text change. Scheme
details come from myScheme in all five. `src/lib/parse.ts` understands spoken answers in all
five (number words, money words, native digits, work/gender/yes-no words). Phone speech:
Android recognizer (hi-IN, te-IN, kn-IN…) + Android text-to-speech where no recording exists
(Azure clips exist only for ta/en; generate.py also has hi/te/kn voices: `--langs hi te kn`).
- Voice: @capgo/capacitor-speech-recognition (Android WebView has no Web Speech API)

### Official scheme data
`npm run schemes:extract` (in app/) writes `src/data/scheme-details.json` (English + Tamil):
benefits, eligibility, exclusions, how-to-apply steps, documents, and official form / portal
links. 7 schemes come from myScheme's public data (the same API Setu data its pages load);
KMUT, Tamizh Pudhalvan and e-Shram are curated from their official sites in
`scripts/manual-schemes.json`, which also holds `_overrides` for gaps/outdated myScheme data
(e.g. TN old-age pension is ₹1,200 since Aug 2023). Eligibility *rules* stay hand-written in
`src/data/schemes.ts` — keep them in line with the extracted official text.

### Recorded voice
Every spoken line is a pre-recorded MP3 in `app/public/voice/` (Azure neural voices:
ta-IN-PallaviNeural, en-IN-NeerjaNeural; manifest.json maps "lang|text" → file). Lines without
a clip fall back to the browser voice. After changing any spoken text:
1. `npm run voice:lines` (in app/) → tools/tts/lines.json
2. In tools/tts, with AZURE_SPEECH_KEY and AZURE_SPEECH_REGION=centralindia set in the terminal:
   `PYTHONIOENCODING=utf-8 .venv/Scripts/python generate.py --engine azure`
Never write the Azure key into any file. `--engine parler` (AI4Bharat, gated on Hugging Face)
is an offline alternative; model cache lives on D: because C: is nearly full.
