/**
 * The tap / type backup for a question: shown after two failed voice tries, when the
 * mic is unavailable, when the user taps "Type", and when editing an answer.
 */
import { useMemo, useState } from 'react'
import { ArrowRight, Search } from 'lucide-react'
import type { InputKind } from '../data/questions'
import type { Text } from '../types'
import type { Parsed } from '../lib/parse'
import { DISTRICTS } from '../data/districts'
import { useApp } from '../state'

type Props = {
  kind: InputKind
  choices?: { value: string; label: Text }[]
  parse: (text: string) => Parsed<unknown>
  numeric?: boolean
  initial?: string
  /** value = parsed value; shown = text for the green answer line */
  onSubmit: (value: unknown, shown: string) => void
}

export function AnswerInput({ kind, choices, parse, numeric, initial = '', onSubmit }: Props) {
  const { t, pick, lang } = useApp()
  const [text, setText] = useState(initial)
  const [error, setError] = useState<string | null>(null)

  const submitText = (raw: string) => {
    const res = parse(raw)
    if (res.ok) { setError(null); onSubmit(res.value, raw.trim()) }
    else setError(res.error[lang])
  }

  if (kind === 'yesno') {
    return (
      <div className="answer-grid answer-grid--2">
        <button type="button" className="choice choice--big" onClick={() => onSubmit(true, t('yes'))}>{t('yes')}</button>
        <button type="button" className="choice choice--big" onClick={() => onSubmit(false, t('no'))}>{t('no')}</button>
      </div>
    )
  }

  if (kind === 'choice' && choices) {
    return (
      <div className="answer-grid">
        {choices.map((c) => (
          <button key={c.value} type="button" className="choice" onClick={() => onSubmit(c.value, pick(c.label))}>
            {pick(c.label)}
          </button>
        ))}
      </div>
    )
  }

  if (kind === 'district') return <DistrictPicker onPick={(en, shown) => onSubmit(en, shown)} />

  return (
    <div className="answer-stack">
      {kind === 'income' && choices && (
        <div className="answer-grid">
          {choices.map((c) => (
            <button key={c.value} type="button" className="choice" onClick={() => onSubmit(Number(c.value), pick(c.label))}>
              {pick(c.label)}
            </button>
          ))}
        </div>
      )}
      <form
        className="answer-form"
        onSubmit={(e) => { e.preventDefault(); submitText(text) }}
      >
        <input
          className="field"
          value={text}
          onChange={(e) => setText(e.target.value)}
          inputMode={kind === 'number' || kind === 'income' || numeric ? 'numeric' : 'text'}
          placeholder={kind === 'income' ? t('orTypeAmount') : ''}
          aria-label={kind === 'income' ? t('orTypeAmount') : t('type')}
          autoFocus={kind !== 'income'}
        />
        <button type="submit" className="send" aria-label={t('next')} disabled={!text.trim()}>
          <ArrowRight size={20} strokeWidth={2.5} />
        </button>
      </form>
      {error && <p className="input-error">{error}</p>}
    </div>
  )
}

function DistrictPicker({ onPick }: { onPick: (en: string, shown: string) => void }) {
  const { t, lang } = useApp()
  const [q, setQ] = useState('')
  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    const sorted = [...DISTRICTS].sort((a, b) => a[lang].localeCompare(b[lang], lang))
    if (!s) return sorted
    return sorted.filter((d) => d.en.toLowerCase().includes(s) || d.ta.includes(q.trim()) || d.aliases.some((a) => a.includes(s)))
  }, [q, lang])
  return (
    <div className="answer-stack">
      <label className="search">
        <Search size={18} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('searchDistrict')} aria-label={t('searchDistrict')} />
      </label>
      <div className="district-list">
        {list.map((d) => (
          <button key={d.en} type="button" className="district" onClick={() => onPick(d.en, d[lang])}>
            {d[lang]}
            {lang === 'ta' && <small>{d.en}</small>}
          </button>
        ))}
      </div>
    </div>
  )
}
