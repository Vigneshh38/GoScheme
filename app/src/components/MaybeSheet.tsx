import { Sheet } from './ui'
import { VoicePrompt } from './VoicePrompt'
import { QUESTIONS } from '../data/questions'
import { isHouseholdKey } from '../lib/format'
import type { Evaluation } from '../lib/rules'
import { evaluate } from '../lib/rules'
import { useApp } from '../state'
import type { HouseholdFacts, Member } from '../types'

/** Asks the one missing fact behind a "Maybe" and reports the new result. */
export function MaybeSheet({ ev, onClose, onResult }: { ev: Evaluation | null; onClose: () => void; onResult: (text: string) => void }) {
  const { state, lang, t, pick, dispatch } = useApp()
  const key = ev?.missing
  const q = key ? QUESTIONS[key] : null

  const answer = (value: unknown) => {
    if (!ev || !key) return
    const household: HouseholdFacts = isHouseholdKey(key) ? { ...state.household, [key]: value } : state.household
    const member: Member = isHouseholdKey(key) ? ev.member : { ...ev.member, [key]: value }
    if (isHouseholdKey(key)) dispatch({ type: 'household', patch: { [key]: value } })
    else dispatch({ type: 'memberFact', id: ev.member.id, patch: { [key]: value } })
    const next = evaluate(ev.scheme, member, household)
    const label = next.status === 'eligible' ? t('eligible') : next.status === 'maybe' ? t('maybe') : t('notEligible')
    onResult(`${pick(ev.scheme.name)}: ${label}`)
    onClose()
  }

  return (
    <Sheet open={!!q} onClose={onClose} label={t('answerOneQuestion')}>
      {q && ev && (
        <div className="sheet-body">
          <p className="eyebrow">{pick(ev.scheme.name)}</p>
          <VoicePrompt
            id={`${ev.scheme.id}:${ev.member.id}:${key}`}
            prompt={q.ask(lang, { self: ev.member.relation === 'self', name: ev.member.name })}
            spoken={q.say(lang, ev.member.relation === 'self')}
            kind={q.input}
            parse={q.parse}
            onAnswer={answer}
          />
        </div>
      )}
    </Sheet>
  )
}
