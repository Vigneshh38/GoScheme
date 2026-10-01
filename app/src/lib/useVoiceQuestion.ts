/**
 * One spoken question: speak it, listen, check the answer.
 * - clear + valid        → phase "accepted", onAccept(value, words heard)
 * - unclear or invalid   → phase "rejected" (red shake), then ask again
 * - after 2 failed tries → switch to the tap / type backup
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Lang } from '../types'
import type { Parsed } from './parse'
import { canRecognize, listen, micState, MIN_CONFIDENCE, MIN_CONFIDENCE_IF_VALID, speak, stopSpeaking, type Listening } from './speech'
import { translate, type StrKey } from '../i18n'
import { pickText } from '../lang'

export type Phase = 'idle' | 'speaking' | 'listening' | 'accepted' | 'rejected'

type Opts<T> = {
  /** Changing this starts a fresh question. */
  id: string
  lang: Lang
  prompt: string
  /** What to say aloud, if different from the text on screen (e.g. without a name). */
  spoken?: string
  /** Said once before the first ask, e.g. a greeting. */
  intro?: string
  parse: (text: string) => Parsed<T>
  onAccept: (value: T, heard: string) => void
  /** How to show an accepted answer, e.g. "21 years" instead of "currently I am 21". */
  show?: (value: T) => string
  /** Ask aloud and start listening as soon as the question appears. */
  auto?: boolean
}

const MAX_TRIES = 2
// Inside a Claude Artifact the frame always refuses the mic, so don't tell people to allow it.
const BLOCKED_MSG: StrKey = import.meta.env.MODE === 'artifact' ? 'noMicInPreview' : 'micBlocked'

export function useVoiceQuestion<T>({ id, lang, prompt, spoken, intro, parse, onAccept, show, auto = true }: Opts<T>) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [heard, setHeard] = useState('')
  const [error, setError] = useState<string | null>(null)
  const voiceOff = () => !canRecognize() || micState.blocked
  const [fallback, setFallback] = useState(voiceOff)
  const [notice, setNotice] = useState<string | null>(() =>
    !canRecognize() ? translate(lang, 'noVoiceSupport') : micState.blocked ? translate(lang, BLOCKED_MSG) : null)

  const token = useRef(0)
  const tries = useRef(0)
  const current = useRef<Listening | null>(null)
  const said = spoken ?? prompt
  const latest = useRef({ lang, prompt: said, intro, parse, onAccept, show })
  latest.current = { lang, prompt: said, intro, parse, onAccept, show }

  const cancel = useCallback(() => {
    token.current++
    current.current?.abort()
    current.current = null
    stopSpeaking()
  }, [])

  const msg = (k: StrKey) => translate(latest.current.lang, k)

  const listenOnce = useCallback(async (my: number) => {
    const { lang: l } = latest.current
    setPhase('listening')
    setHeard('')
    const session = listen(l, (text) => { if (token.current === my) setHeard(text) })
    current.current = session
    const res = await session.result
    if (token.current !== my) return
    current.current = null

    if (res.kind === 'aborted') { setPhase('idle'); return }
    if (res.kind === 'blocked' || res.kind === 'unsupported' || res.kind === 'network') {
      if (res.kind === 'blocked') micState.blocked = true
      setFallback(true)
      setPhase('idle')
      setNotice(msg(res.kind === 'network' ? 'networkError' : res.kind === 'blocked' ? BLOCKED_MSG : 'noVoiceSupport'))
      return
    }

    let problem: string | null = null
    if (res.kind === 'silence') problem = msg('heardNothing')
    else {
      // Try every guess the phone made; take the first one that is a valid answer.
      for (const alt of res.alternatives) {
        if (alt.confidence > 0 && alt.confidence < MIN_CONFIDENCE_IF_VALID) continue
        const parsed = latest.current.parse(alt.transcript)
        if (parsed.ok) {
          const { show } = latest.current
          setHeard(show ? show(parsed.value) : alt.transcript)
          setPhase('accepted')
          setError(null)
          latest.current.onAccept(parsed.value, alt.transcript)
          return
        }
      }
      setHeard(res.transcript)
      const parsed = latest.current.parse(res.transcript)
      const lowConfidence = res.confidence > 0 && res.confidence < MIN_CONFIDENCE
      problem = parsed.ok || lowConfidence ? msg('unclear') : pickText(parsed.error, l)
    }

    tries.current++
    setError(problem)
    setPhase('rejected')
    if (tries.current >= MAX_TRIES) {
      setTimeout(() => {
        if (token.current !== my) return
        setFallback(true)
        setPhase('idle')
        setError(msg('tapInstead'))
      }, 900)
      return
    }
    // Ask the same question again.
    await new Promise((r) => setTimeout(r, 1100))
    if (token.current !== my) return
    setPhase('speaking')
    await speak([msg('sayAgain'), latest.current.prompt], l, { get cancelled() { return token.current !== my } })
    if (token.current !== my) return
    listenOnce(my)
  }, [])

  const fallbackRef = useRef(fallback)
  fallbackRef.current = fallback

  const run = useCallback(async (withSpeech: boolean) => {
    cancel()
    const my = token.current
    if (withSpeech) {
      setPhase('speaking')
      const { intro: hello, prompt: q } = latest.current
      await speak(hello ? [hello, q] : q, latest.current.lang, { get cancelled() { return token.current !== my } })
      if (token.current !== my) return
    }
    if (!canRecognize() || fallbackRef.current) { setPhase('idle'); return }
    listenOnce(my)
  }, [cancel, listenOnce])

  // New question → reset and ask.
  useEffect(() => {
    tries.current = 0
    setHeard('')
    setError(null)
    setPhase('idle')
    const off = voiceOff()
    setFallback(off)
    fallbackRef.current = off
    if (auto) run(true)
    return cancel
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  return {
    phase,
    heard,
    error,
    fallback,
    notice,
    /** Tap on the orb: listen now (or stop listening). */
    tapOrb: () => {
      if (phase === 'listening') { current.current?.stop(); return }
      if (!canRecognize()) return
      micState.blocked = false
      setFallback(false)
      fallbackRef.current = false
      setError(null)
      run(false)
    },
    repeat: () => { setError(null); run(true) },
    showFallback: () => { cancel(); setFallback(true); setPhase('idle') },
    /** Answer given by tap / typing. */
    acceptManual: (value: T, shown: string) => {
      cancel()
      setHeard(latest.current.show ? latest.current.show(value) : shown)
      setError(null)
      setPhase('accepted')
      latest.current.onAccept(value, shown)
    },
  }
}

export type VoiceQuestion = ReturnType<typeof useVoiceQuestion>
