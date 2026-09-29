import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Keyboard, Volume2, AudioLines } from 'lucide-react'
import { Orb } from '../components/Orb'
import { TopBar } from '../components/ui'
import { AnswerInput } from '../components/AnswerInput'
import { LangSwitch } from '../components/LangSwitch'
import { QUESTIONS, type QuestionKey } from '../data/questions'
import { formatValue, isHouseholdKey, rawAnswer } from '../lib/format'
import { useVoiceQuestion } from '../lib/useVoiceQuestion'
import { useApp } from '../state'
import type { Member } from '../types'

type Props = {
  member: Member
  flow: QuestionKey[]
  onDone: () => void
  onExit: () => void
}

/** How long the green answer stays before it slides away and the next question comes in. */
const ACCEPT_PAUSE = 1000

export function Onboarding({ member, flow, onDone, onExit }: Props) {
  const { state, lang, t, pick, dispatch } = useApp()
  // Resume at the first unanswered question (e.g. after the app was closed half-way).
  const [index, setIndex] = useState(() => {
    const i = flow.findIndex((k) => rawAnswer(k, member, state.household) === undefined)
    return i === -1 ? 0 : i
  })
  const advancing = useRef(false)

  const key = flow[index]
  const q = QUESTIONS[key]
  const self = member.relation === 'self'
  const ctxName = member.name || (lang === 'ta' ? 'அவர்' : 'them')
  const prompt = q.ask(lang, { self, name: ctxName })
  const other = q.ask(lang === 'ta' ? 'en' : 'ta', { self, name: ctxName })

  const save = (value: unknown) => {
    if (key === 'name') dispatch({ type: 'memberFact', id: member.id, patch: { name: value as string } })
    else if (isHouseholdKey(key)) dispatch({ type: 'household', patch: { [key]: value } })
    else dispatch({ type: 'memberFact', id: member.id, patch: { [key]: value } })
  }

  const vq = useVoiceQuestion<unknown>({
    id: `${member.id}:${index}:${lang}`,
    lang,
    prompt,
    spoken: q.say(lang, self),
    // Greet the owner before the very first question.
    intro: self && index === 0 && !member.name ? t('intro') : undefined,
    parse: q.parse,
    // Show just the answer ("21 years"), not the whole sentence that was said.
    show: (value) => formatValue(key, value, lang),
    onAccept: (value) => {
      if (advancing.current) return
      advancing.current = true
      save(value)
      setTimeout(() => {
        advancing.current = false
        if (index < flow.length - 1) setIndex(index + 1)
        else onDone()
      }, ACCEPT_PAUSE)
    },
  })

  return (
    <div className="screen onboard">
      <TopBar
        onBack={index > 0 ? () => setIndex(index - 1) : onExit}
        title={<Progress total={flow.length} at={index} />}
        right={<LangSwitch />}
      />

      <div className="onboard-main">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${index}-${lang}`}
            className="q-block"
            initial={{ x: 48, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -64, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="q-step">
              {t('question')} {index + 1} {t('of')} {flow.length}
            </p>
            <h1 className="q-text">{prompt}</h1>
            <p className="q-sub">{other}</p>
          </motion.div>
        </AnimatePresence>

        <div className="orb-stage">
          <Orb phase={vq.phase} onClick={vq.tapOrb} label={vq.phase === 'listening' ? t('listening') : t('tapToSpeak')} />
        </div>

        <div className="q-status" aria-live="polite">
          <StatusLine phase={vq.phase} heard={vq.heard} error={vq.error} notice={vq.notice} hint={pick(q.hint)} />
        </div>

        <div className="answer-slot">
          <AnimatePresence initial={false}>
            {vq.phase === 'accepted' && (
              <motion.div
                key={`ans-${index}`}
                className="answer-pill"
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ x: '-120%', opacity: 0, transition: { duration: 0.42, ease: [0.55, 0, 0.1, 1] } }}
              >
                <span className="answer-pill-text">{vq.heard}</span>
                <span className="answer-pill-ok"><Check size={18} strokeWidth={3} /></span>
              </motion.div>
            )}
          </AnimatePresence>

          {vq.fallback && vq.phase !== 'accepted' && (
            <motion.div key={`fb-${index}`} className="fallback" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <AnswerInput
                kind={q.input}
                choices={q.choices}
                parse={q.parse}
                onSubmit={(value, shown) => vq.acceptManual(value, shown)}
              />
            </motion.div>
          )}
        </div>
      </div>

      <footer className="controls">
        <button type="button" className="ctrl" onClick={vq.showFallback} disabled={vq.fallback || vq.phase === 'accepted'}>
          <span className="ctrl-ic"><Keyboard size={20} /></span>
          {t('type')}
        </button>
        <button type="button" className="ctrl" onClick={vq.repeat} disabled={vq.phase === 'accepted'}>
          <span className="ctrl-ic"><Volume2 size={20} /></span>
          {t('repeat')}
        </button>
      </footer>
    </div>
  )
}

function StatusLine({ phase, heard, error, notice, hint }: { phase: string; heard: string; error: string | null; notice: string | null; hint: string }) {
  const { t } = useApp()
  if (phase === 'accepted') return null
  if (phase === 'rejected' && error) return <p className="status status--error">{error}</p>
  if (phase === 'listening') {
    return heard ? (
      <p className="status status--heard">“{heard}”</p>
    ) : (
      <p className="status status--listening">
        <span className="wave" aria-hidden="true"><i /><i /><i /><i /><i /></span>
        {t('listening')}
      </p>
    )
  }
  if (phase === 'speaking') return <p className="status"><AudioLines size={16} /> {t('speaking')}</p>
  if (error) return <p className="status status--error">{error}</p>
  if (notice) return <p className="status status--notice">{notice}</p>
  return <p className="status">{hint}</p>
}

function Progress({ total, at }: { total: number; at: number }) {
  return (
    <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={at}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={i < at ? 'done' : i === at ? 'now' : ''} />
      ))}
    </div>
  )
}
