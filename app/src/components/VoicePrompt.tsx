/**
 * A compact spoken question for sheets: "Maybe — answer 1 question" and the voice fields
 * of a form. Same behaviour as onboarding, with the tap / type answer always visible.
 */
import { Check } from 'lucide-react'
import { Orb } from './Orb'
import { AnswerInput } from './AnswerInput'
import type { InputKind } from '../data/questions'
import type { Parsed } from '../lib/parse'
import { useVoiceQuestion } from '../lib/useVoiceQuestion'
import { useApp } from '../state'

type Props = {
  id: string
  prompt: string
  spoken?: string
  kind: InputKind
  numeric?: boolean
  parse: (text: string) => Parsed<unknown>
  onAnswer: (value: unknown, shown: string) => void
}

export function VoicePrompt({ id, prompt, spoken, kind, numeric, parse, onAnswer }: Props) {
  const { lang, t } = useApp()
  const vq = useVoiceQuestion<unknown>({
    id: `${id}:${lang}`,
    lang,
    prompt,
    spoken,
    parse,
    show: (value) => (typeof value === 'boolean' ? t(value ? 'yes' : 'no') : String(value)),
    onAccept: (value, heard) => setTimeout(() => onAnswer(value, heard), 700),
  })
  return (
    <div className="vp">
      <h2 className="h2 vp-q">{prompt}</h2>
      <div className="vp-row">
        <Orb phase={vq.phase} size={84} onClick={vq.tapOrb} label={t('tapToSpeak')} />
        <div className="vp-status" aria-live="polite">
          {vq.phase === 'accepted' ? (
            <span className="vp-ok"><Check size={16} strokeWidth={3} /> {vq.heard}</span>
          ) : vq.phase === 'rejected' ? (
            <span className="vp-err">{vq.error}</span>
          ) : vq.phase === 'listening' ? (
            <span className="vp-heard">{vq.heard ? `“${vq.heard}”` : t('listening')}</span>
          ) : vq.phase === 'speaking' ? (
            <span>{t('speaking')}</span>
          ) : (
            <span>{vq.notice ?? t('tapToSpeak')}</span>
          )}
        </div>
      </div>
      <AnswerInput kind={kind} parse={parse} numeric={numeric} onSubmit={(v, shown) => vq.acceptManual(v, shown)} />
    </div>
  )
}
