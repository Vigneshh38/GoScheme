import { useEffect, useRef, type RefObject } from 'react'
import type { Phase } from '../lib/useVoiceQuestion'

type Props = {
  phase: Phase
  size?: number
  label: string
  onClick?: () => void
}

/**
 * The voice circle. Blue and breathing while idle or speaking, rippling while listening
 * (and, on computers, swelling with the microphone level), green when an answer is
 * accepted, red with a shake when it isn't.
 */
export function Orb({ phase, size = 176, label, onClick }: Props) {
  const ref = useRef<HTMLButtonElement>(null)
  useMicLevel(ref, phase === 'listening')

  return (
    <button
      ref={ref}
      type="button"
      className={`orb orb--${phase}`}
      style={{ ['--orb' as string]: `${size}px` }}
      onClick={onClick}
      aria-label={label}
    >
      <span className="orb-ripple" />
      <span className="orb-ripple" />
      <span className="orb-ripple" />
      <span className="orb-halo" />
      <span className="orb-core">
        <span className="orb-layer orb-layer--blue" />
        <span className="orb-layer orb-layer--green" />
        <span className="orb-layer orb-layer--red" />
        <span className="orb-shine" />
      </span>
    </button>
  )
}

/**
 * Feeds the live microphone level into the `--level` CSS variable. Skipped on touch
 * phones, where opening a second audio stream can interrupt speech recognition.
 */
function useMicLevel(ref: RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    const el = ref.current
    if (!active || !el || !navigator.mediaDevices?.getUserMedia || matchMedia('(pointer: coarse)').matches) return
    let stream: MediaStream | undefined
    let ctx: AudioContext | undefined
    let raf = 0
    let stopped = false
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((s) => {
        if (stopped) { s.getTracks().forEach((t) => t.stop()); return }
        stream = s
        ctx = new AudioContext()
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 512
        ctx.createMediaStreamSource(s).connect(analyser)
        const buf = new Uint8Array(analyser.fftSize)
        let smooth = 0
        const tick = () => {
          analyser.getByteTimeDomainData(buf)
          let sum = 0
          for (const v of buf) sum += ((v - 128) / 128) ** 2
          const rms = Math.sqrt(sum / buf.length)
          smooth = smooth * 0.75 + Math.min(1, rms * 5) * 0.25
          el.style.setProperty('--level', smooth.toFixed(3))
          raf = requestAnimationFrame(tick)
        }
        tick()
      })
      .catch(() => { /* level is decoration only */ })
    return () => {
      stopped = true
      cancelAnimationFrame(raf)
      stream?.getTracks().forEach((t) => t.stop())
      ctx?.close()
      el.style.setProperty('--level', '0')
    }
  }, [ref, active])
}
