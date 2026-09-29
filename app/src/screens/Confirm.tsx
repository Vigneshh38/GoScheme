import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { Button, Disclaimer, Sheet, TopBar } from '../components/ui'
import { AnswerInput } from '../components/AnswerInput'
import { QUESTIONS, type QuestionKey } from '../data/questions'
import { ANSWER_LABEL, formatAnswer, isHouseholdKey } from '../lib/format'
import { useApp } from '../state'
import type { Member } from '../types'

type Props = { member: Member; flow: QuestionKey[]; onDone: () => void; onBack: () => void }

export function Confirm({ member, flow, onDone, onBack }: Props) {
  const { state, t, lang, dispatch } = useApp()
  const [editing, setEditing] = useState<QuestionKey | null>(null)
  const q = editing ? QUESTIONS[editing] : null
  const self = member.relation === 'self'

  const save = (key: QuestionKey, value: unknown) => {
    if (key === 'name') dispatch({ type: 'memberFact', id: member.id, patch: { name: value as string } })
    else if (isHouseholdKey(key)) dispatch({ type: 'household', patch: { [key]: value } })
    else dispatch({ type: 'memberFact', id: member.id, patch: { [key]: value } })
    setEditing(null)
  }

  return (
    <div className="screen">
      <TopBar onBack={onBack} />
      <div className="body">
        <h1 className="h1">{t('confirmTitle')}</h1>
        <p className="lead">{t('confirmLead')}</p>
        <div className="rows">
          {flow.map((key) => (
            <button key={key} type="button" className="row" onClick={() => setEditing(key)}>
              <span className="row-label">{t(ANSWER_LABEL[key] ?? 'edit')}</span>
              <span className="row-value">{formatAnswer(key, member, state.household, lang)}</span>
              <Pencil size={16} className="row-edit" aria-label={t('edit')} />
            </button>
          ))}
        </div>
      </div>
      <footer className="footer">
        <Button block onClick={onDone}>{self ? t('showSchemes') : t('addToFamily')}</Button>
        <Disclaimer />
      </footer>

      <Sheet open={!!q} onClose={() => setEditing(null)} label={t('edit')}>
        {q && editing && (
          <div className="sheet-body">
            <h2 className="h2">{q.ask(lang, { self, name: member.name })}</h2>
            <AnswerInput
              key={editing}
              kind={q.input}
              choices={q.choices}
              parse={q.parse}
              initial={editing === 'name' ? member.name : ''}
              onSubmit={(value) => save(editing, value)}
            />
          </div>
        )}
      </Sheet>
    </div>
  )
}
