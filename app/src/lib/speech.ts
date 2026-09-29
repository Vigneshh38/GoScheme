/**
 * Voice in and out, using the browser's built-in speech services.
 * - Recognition: Chrome/Edge `SpeechRecognition` (ta-IN / en-IN). Needs internet and mic access.
 * - Speaking: `speechSynthesis`, only when a voice for that language is installed; otherwise
 *   the question is just shown on screen (a Tamil question read by an English voice is noise).
 */
import type { Lang } from '../types'

type SRResultList = { length: number; [i: number]: { isFinal: boolean; length: number; [j: number]: { transcript: string; confidence: number } } }
type SREvent = { resultIndex: number; results: SRResultList }
type SRErrorEvent = { error: string }
type SpeechRec = {
  lang: string
  interimResults: boolean
  continuous: boolean
  maxAlternatives: number
  onresult: ((e: SREvent) => void) | null
  onerror: ((e: SRErrorEvent) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type SRWindow = { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec }

/** Looked up on each use (not at load), so tests can plug in a scripted recognizer. */
function getSR(): (new () => SpeechRec) | undefined {
  if (typeof window === 'undefined') return undefined
  const w = window as unknown as SRWindow
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

export function canRecognize(): boolean {
  return !!getSR()
}

/** Set when the user blocks the microphone; later questions go straight to tap / type. */
export const micState = { blocked: false }

export type Alternative = { transcript: string; confidence: number }

export type Heard =
  /** `alternatives`: the recognizer's guesses, most confident first (phones often mishear one word) */
  | { kind: 'ok'; transcript: string; confidence: number; alternatives: Alternative[] }
  | { kind: 'silence' }
  | { kind: 'blocked' }
  | { kind: 'network' }
  | { kind: 'unsupported' }
  | { kind: 'aborted' }

export type Listening = { result: Promise<Heard>; stop: () => void; abort: () => void }

/** Listen for one answer. `onInterim` receives the words as they are recognised. */
export function listen(lang: Lang, onInterim?: (text: string) => void): Listening {
  const SR = getSR()
  if (!SR) return { result: Promise.resolve({ kind: 'unsupported' }), stop: () => {}, abort: () => {} }
  const rec = new SR()
  rec.lang = lang === 'ta' ? 'ta-IN' : 'en-IN'
  rec.interimResults = true
  rec.continuous = false
  rec.maxAlternatives = 3

  let done = false
  let finalText = ''
  let finalConf = 0
  let finalAlts: Alternative[] = []
  let interim = ''
  let settle: (h: Heard) => void = () => {}
  const result = new Promise<Heard>((resolve) => {
    settle = (h) => {
      if (done) return
      done = true
      clearTimeout(timer)
      resolve(h)
    }
  })
  // Safety net: some devices never fire `onend` after long silence.
  const timer = setTimeout(() => { try { rec.stop() } catch { /* already stopped */ } }, 12000)

  rec.onresult = (e) => {
    interim = ''
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const res = e.results[i]
      // Pick the most confident alternative of each final result.
      let best = res[0]
      for (let j = 1; j < res.length; j++) if (res[j].confidence > best.confidence) best = res[j]
      if (res.isFinal) {
        // One final result (the usual case): keep every guess. Several: keep the joined best.
        const alts = Array.from({ length: res.length }, (_, j) => ({ transcript: res[j].transcript.trim(), confidence: res[j].confidence }))
        finalAlts = finalText ? [] : alts
        finalText += best.transcript
        finalConf = best.confidence
      } else interim += best.transcript
    }
    onInterim?.((finalText + ' ' + interim).trim())
  }
  rec.onerror = (e) => {
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed' || e.error === 'audio-capture') settle({ kind: 'blocked' })
    else if (e.error === 'network') settle({ kind: 'network' })
    else if (e.error === 'aborted') settle({ kind: 'aborted' })
    // 'no-speech' is reported through onend below
  }
  rec.onend = () => {
    const text = (finalText || interim).trim()
    // Chrome on some devices reports confidence 0 for good results; treat 0 as "not given".
    const confidence = finalText ? finalConf : 0
    const alternatives = finalAlts.length ? [...finalAlts].sort((a, b) => b.confidence - a.confidence) : [{ transcript: text, confidence }]
    if (text) settle({ kind: 'ok', transcript: text, confidence, alternatives })
    else settle({ kind: 'silence' })
  }
  try {
    rec.start()
  } catch {
    settle({ kind: 'blocked' })
  }
  return {
    result,
    stop: () => { try { rec.stop() } catch { /* not running */ } },
    abort: () => { try { rec.abort() } catch { /* not running */ } settle({ kind: 'aborted' }) },
  }
}

/** Confidence below this (when the browser gives one) means "ask again". */
export const MIN_CONFIDENCE = 0.45
/** A guess that makes sense as an answer is accepted down to this confidence
 *  (phones give short one-word answers like "male" or "four" low scores). */
export const MIN_CONFIDENCE_IF_VALID = 0.12

// ---------- speaking ----------
//
// 1. Recorded clips: every fixed sentence is pre-recorded in a natural, calm female voice
//    (AI4Bharat Indic Parler-TTS, see tools/tts). public/voice/manifest.json maps
//    "lang|sentence" to its audio file.
// 2. Anything without a clip falls back to the browser voice, preferring natural female
//    voices (e.g. "Microsoft Pallavi Online (Natural)" in Edge, Google Tamil on Android).

let manifest: Promise<Record<string, string>> | null = null

function clips(): Promise<Record<string, string>> {
  manifest ??= fetch(`${import.meta.env.BASE_URL}voice/manifest.json`)
    .then((r) => (r.ok ? r.json() : {}))
    .catch(() => ({}))
  return manifest
}

/** Start downloading the clip list early so the first question plays without delay. */
export function preloadVoice(): void {
  void clips()
}

let current: HTMLAudioElement | null = null

function playClip(url: string, signal?: { cancelled: boolean }): Promise<boolean> {
  return new Promise((resolve) => {
    if (signal?.cancelled) return resolve(true)
    const audio = new Audio(url)
    current = audio
    const done = (ok: boolean) => { if (current === audio) current = null; resolve(ok) }
    audio.onended = () => done(true)
    audio.onerror = () => done(false)
    audio.onpause = () => done(true)
    audio.play().catch(() => done(false))
  })
}

let voicesReady: Promise<SpeechSynthesisVoice[]> | null = null

function voices(): Promise<SpeechSynthesisVoice[]> {
  if (typeof speechSynthesis === 'undefined') return Promise.resolve([])
  voicesReady ??= new Promise((resolve) => {
    const now = speechSynthesis.getVoices()
    if (now.length) return resolve(now)
    const done = () => resolve(speechSynthesis.getVoices())
    speechSynthesis.addEventListener('voiceschanged', done, { once: true })
    setTimeout(done, 1200)
  })
  return voicesReady
}

const FEMALE = /pallavi|neerja|swara|heera|kalpana|zira|aria|jenny|female|woman|google/i
const NATURAL = /natural|online|neural|google/i

async function voiceFor(lang: Lang): Promise<SpeechSynthesisVoice | undefined> {
  const all = await voices()
  const pool = lang === 'ta' ? all.filter((v) => v.lang.toLowerCase().startsWith('ta')) : all.filter((v) => v.lang.startsWith('en'))
  if (!pool.length) return undefined
  const score = (v: SpeechSynthesisVoice) =>
    (NATURAL.test(v.name) ? 4 : 0) + (FEMALE.test(v.name) ? 2 : 0) + (v.lang === 'en-IN' || v.lang === 'ta-IN' ? 1 : 0)
  return [...pool].sort((a, b) => score(b) - score(a))[0]
}

async function speakSynth(text: string, lang: Lang, signal?: { cancelled: boolean }): Promise<void> {
  const voice = await voiceFor(lang)
  if (!voice || signal?.cancelled) return
  speechSynthesis.cancel()
  await new Promise<void>((resolve) => {
    const u = new SpeechSynthesisUtterance(text)
    u.voice = voice
    u.lang = voice.lang
    u.rate = 0.92 // a little slower sounds calmer
    u.pitch = 1.05
    const finish = () => { clearTimeout(t); resolve() }
    // Fallback in case `onend` never fires (a known Chrome quirk).
    const t = setTimeout(finish, 1500 + text.length * 90)
    u.onend = finish
    u.onerror = finish
    speechSynthesis.speak(u)
  })
}

/** Speak one or more sentences in order; resolves when done or cancelled. */
export async function speak(text: string | string[], lang: Lang, signal?: { cancelled: boolean }): Promise<void> {
  const map = await clips()
  for (const line of Array.isArray(text) ? text : [text]) {
    if (signal?.cancelled) return
    const url = map[`${lang}|${line}`]
    if (url && (await playClip(`${import.meta.env.BASE_URL}voice/${url}`, signal))) continue
    await speakSynth(line, lang, signal)
  }
}

export async function canSpeak(lang: Lang): Promise<boolean> {
  const map = await clips()
  return Object.keys(map).some((k) => k.startsWith(`${lang}|`)) || !!(await voiceFor(lang))
}

export function stopSpeaking(): void {
  if (current) { current.pause(); current = null }
  if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel()
}
