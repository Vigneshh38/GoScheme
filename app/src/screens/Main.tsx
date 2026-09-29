import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronDown, FileCheck, FileText, House, Lock, LockOpen, Pencil, Plus, Sparkles, Trash2, Users,
} from 'lucide-react'
import { Button, Disclaimer, IconTile, Sheet, Toast } from '../components/ui'
import { SchemeCard } from '../components/SchemeCard'
import { MaybeSheet } from '../components/MaybeSheet'
import { LangSwitch } from '../components/LangSwitch'
import { AnswerInput } from '../components/AnswerInput'
import { matchFamily, type Evaluation } from '../lib/rules'
import { ANSWER_LABEL, formatAnswer, initial } from '../lib/format'
import { canPersist } from '../lib/store'
import { schemeById } from '../data/schemes'
import { QUESTIONS, type QuestionKey } from '../data/questions'
import { inr, relationLabel, OCCUPATIONS } from '../i18n'
import { districtByName } from '../data/districts'
import { useApp } from '../state'
import type { Member } from '../types'

export type Tab = 'schemes' | 'forms' | 'family'

type Props = {
  tab: Tab
  setTab: (t: Tab) => void
  openScheme: (schemeId: string, memberId?: string) => void
  openForm: (formId: string) => void
  addMember: () => void
}

export function Main({ tab, setTab, openScheme, openForm, addMember }: Props) {
  const { t } = useApp()
  const [toast, setToast] = useState<string | null>(null)
  const flash = (text: string) => {
    setToast(text)
    setTimeout(() => setToast(null), 2600)
  }
  const tabs: [Tab, typeof House, string][] = [
    ['schemes', House, t('tabSchemes')],
    ['forms', FileText, t('tabForms')],
    ['family', Users, t('tabProfile')],
  ]
  return (
    <div className="screen main">
      <div className="main-body">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
            {tab === 'schemes' && <SchemesTab openScheme={openScheme} addMember={addMember} flash={flash} />}
            {tab === 'forms' && <FormsTab openForm={openForm} goSchemes={() => setTab('schemes')} />}
            {tab === 'family' && <FamilyTab addMember={addMember} flash={flash} />}
          </motion.div>
        </AnimatePresence>
      </div>
      <Toast text={toast} />
      <nav className="tabbar" aria-label="Main">
        {tabs.map(([id, Icon, label]) => (
          <button key={id} type="button" className={`tab${tab === id ? ' tab--on' : ''}`} onClick={() => setTab(id)} aria-current={tab === id ? 'page' : undefined}>
            <Icon size={23} strokeWidth={tab === id ? 2.4 : 2} />
            {label}
          </button>
        ))}
      </nav>
    </div>
  )
}

// ---------- Schemes ----------

function SchemesTab({ openScheme, addMember, flash }: { openScheme: Props['openScheme']; addMember: () => void; flash: (s: string) => void }) {
  const { state, t, lang, owner } = useApp()
  const [only, setOnly] = useState<string | undefined>()
  const [showNot, setShowNot] = useState(false)
  const [asking, setAsking] = useState<Evaluation | null>(null)

  const matches = useMemo(() => matchFamily(state.members, state.household, only), [state.members, state.household, only])
  const eligible = matches.filter((m) => m.best.status === 'eligible')
  const maybe = matches.filter((m) => m.best.status === 'maybe')
  const not = matches.filter((m) => m.best.status === 'not')
  const cash = eligible.reduce((sum, m) => sum + m.scheme.cashPerYear * Math.max(1, m.eligibleMembers.length), 0)

  const occ = owner?.occupation ? OCCUPATIONS[owner.occupation][lang] : ''
  const dist = districtByName(state.household.district)?.[lang] ?? ''

  return (
    <div className="tab-page">
      <header className="home-head">
        <span className="avatar">{initial(owner?.name ?? '')}</span>
        <div className="home-hello">
          <b>{t('hello')}, {owner?.name}</b>
          <span>{[occ, dist].filter(Boolean).join(' · ')}</span>
        </div>
        <LangSwitch />
      </header>

      <section className="summary" aria-live="polite">
        <p className="summary-eyebrow"><Sparkles size={14} /> {t('foundForFamily')}</p>
        <div className="summary-row">
          <span className="summary-num">{eligible.length}</span>
          <span className="summary-label">{eligible.length === 1 ? t('canApplyOne') : t('canApplyMany')}</span>
        </div>
        {(cash > 0 || maybe.length > 0) && (
          <p className="summary-meta">
            {cash > 0 && <b>{t('worthCash', { amount: inr(cash) })}</b>}
            {cash > 0 && maybe.length > 0 && ' · '}
            {maybe.length > 0 && t('toCheck', { n: maybe.length })}
          </p>
        )}
      </section>

      <div className="chips" role="tablist">
        <button type="button" className={`chip${!only ? ' chip--on' : ''}`} onClick={() => setOnly(undefined)}>
          {t('all')}
        </button>
        {state.members.map((m) => (
          <button key={m.id} type="button" className={`chip${only === m.id ? ' chip--on' : ''}`} onClick={() => setOnly(m.id)}>
            <span className={`chip-dot dot-${m.relation}`}>{initial(m.name)}</span>
            {m.relation === 'self' ? (lang === 'ta' ? 'நான்' : 'Me') : m.name}
          </button>
        ))}
        <button type="button" className="chip chip--add" onClick={addMember} aria-label={t('addMember')}>
          <Plus size={16} strokeWidth={2.6} />
        </button>
      </div>

      {state.members.length === 1 && (
        <button type="button" className="hint" onClick={addMember}>
          <Plus size={16} strokeWidth={2.6} />
          <span><b>{t('addMember')}</b> — {t('addMemberHint')}</span>
        </button>
      )}

      {eligible.length > 0 && <h2 className="section-title">{t('eligibleSection')}</h2>}
      <div className="card-list">
        {eligible.map((m) => (
          <SchemeCard key={m.scheme.id} match={m} onOpen={() => openScheme(m.scheme.id, m.best.member.id)} />
        ))}
      </div>

      {maybe.length > 0 && <h2 className="section-title">{t('maybeSection')}</h2>}
      <div className="card-list">
        {maybe.map((m) => (
          <SchemeCard key={m.scheme.id} match={m} onOpen={() => openScheme(m.scheme.id, m.best.member.id)} onAnswer={() => setAsking(m.best)} />
        ))}
      </div>

      {not.length > 0 && (
        <>
          <button type="button" className="section-toggle" onClick={() => setShowNot(!showNot)} aria-expanded={showNot}>
            <span>{t('notSection')} ({not.length})</span>
            <ChevronDown size={18} className={showNot ? 'rot' : ''} />
          </button>
          <AnimatePresence initial={false}>
            {showNot && (
              <motion.div className="card-list" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                {not.map((m) => (
                  <SchemeCard key={m.scheme.id} match={m} onOpen={() => openScheme(m.scheme.id, m.best.member.id)} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      <Disclaimer />
      <MaybeSheet ev={asking} onClose={() => setAsking(null)} onResult={(text) => flash(`${t('updated')} — ${text}`)} />
    </div>
  )
}

// ---------- My forms ----------

function FormsTab({ openForm, goSchemes }: { openForm: (id: string) => void; goSchemes: () => void }) {
  const { state, t, pick, lang } = useApp()
  return (
    <div className="tab-page">
      <h1 className="h1 tab-title">{t('tabForms')}</h1>
      {state.forms.length === 0 ? (
        <div className="empty">
          <span className="empty-ic"><FileText size={28} /></span>
          <b>{t('noForms')}</b>
          <p>{t('noFormsLead')}</p>
          <Button variant="secondary" onClick={goSchemes}>{t('tabSchemes')}</Button>
        </div>
      ) : (
        <div className="card-list">
          {state.forms.map((f) => {
            const s = schemeById(f.schemeId)
            const m = state.members.find((x) => x.id === f.memberId)
            if (!s) return null
            return (
              <button key={f.id} type="button" className="card card-main form-card" onClick={() => openForm(f.id)}>
                <IconTile icon={s.icon} tone={s.tone} />
                <span className="card-mid">
                  <span className="card-name">{pick(s.name)}</span>
                  <span className="card-who">
                    {m?.name} · {new Date(f.createdAt).toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                </span>
                <span className="badge badge--ok"><FileCheck size={14} />{t('formReadyTag')}</span>
              </button>
            )
          })}
        </div>
      )}
      <Disclaimer />
    </div>
  )
}

// ---------- Family & settings ----------

const HOUSEHOLD_ROWS: QuestionKey[] = ['income', 'district', 'familySize', 'ownsPuccaHouse', 'hasLpg']

function FamilyTab({ addMember, flash }: { addMember: () => void; flash: (s: string) => void }) {
  const { state, t, lang, owner, dispatch, wipe } = useApp()
  const [editKey, setEditKey] = useState<QuestionKey | null>(null)
  const [confirmWipe, setConfirmWipe] = useState(false)
  const [removing, setRemoving] = useState<Member | null>(null)
  const q = editKey ? QUESTIONS[editKey] : null

  return (
    <div className="tab-page">
      <h1 className="h1 tab-title">{t('familyTitle')}</h1>
      <div className="rows">
        {state.members.map((m) => (
          <div key={m.id} className="row row--static">
            <span className={`chip-dot chip-dot--lg dot-${m.relation}`}>{initial(m.name)}</span>
            <span className="row-mid">
              <b>{m.name}</b>
              <small>
                {relationLabel(m.relation, m.gender, lang)}
                {m.age ? ` · ${t('years', { n: m.age })}` : ''}
                {m.occupation ? ` · ${OCCUPATIONS[m.occupation][lang]}` : ''}
              </small>
            </span>
            {m.relation !== 'self' && (
              <button type="button" className="icon-btn" onClick={() => setRemoving(m)} aria-label={`${t('remove')} ${m.name}`}>
                <Trash2 size={18} />
              </button>
            )}
          </div>
        ))}
      </div>
      <Button variant="secondary" icon={Plus} block onClick={addMember}>{t('addMember')}</Button>

      <h2 className="section-title">{t('household')}</h2>
      <div className="rows">
        {owner && HOUSEHOLD_ROWS.map((key) => (
          <button key={key} type="button" className="row" onClick={() => setEditKey(key)}>
            <span className="row-label">{ANSWER_LABEL[key] ? t(ANSWER_LABEL[key]) : QUESTIONS[key].ask(lang, { self: true, name: '' })}</span>
            <span className="row-value">{formatAnswer(key, owner, state.household, lang)}</span>
            <Pencil size={16} className="row-edit" />
          </button>
        ))}
      </div>

      <h2 className="section-title">{t('language')}</h2>
      <div className="seg">
        <button type="button" className={lang === 'ta' ? 'on ta' : 'ta'} onClick={() => dispatch({ type: 'lang', lang: 'ta' })}>தமிழ்</button>
        <button type="button" className={lang === 'en' ? 'on' : ''} onClick={() => dispatch({ type: 'lang', lang: 'en' })}>English</button>
      </div>

      <p className="store-note">
        {canPersist ? <Lock size={15} /> : <LockOpen size={15} />}
        {canPersist ? t('storedEncrypted') : t('notStored')}
      </p>
      <Button variant="danger" icon={Trash2} block onClick={() => setConfirmWipe(true)}>{t('deleteAll')}</Button>
      <Disclaimer />

      <Sheet open={!!q} onClose={() => setEditKey(null)} label={t('edit')}>
        {q && editKey && (
          <div className="sheet-body">
            <h2 className="h2">{q.ask(lang, { self: true, name: owner?.name ?? '' })}</h2>
            <AnswerInput key={editKey} kind={q.input} choices={q.choices} parse={q.parse}
              onSubmit={(value) => { dispatch({ type: 'household', patch: { [editKey]: value } }); setEditKey(null); flash(t('updated')) }} />
          </div>
        )}
      </Sheet>

      <Sheet open={!!removing} onClose={() => setRemoving(null)} label={t('remove')}>
        {removing && (
          <div className="sheet-body">
            <h2 className="h2">{t('remove')} {removing.name}?</h2>
            <div className="sheet-actions">
              <Button variant="secondary" onClick={() => setRemoving(null)}>{t('cancel')}</Button>
              <Button variant="danger" onClick={() => { dispatch({ type: 'removeMember', id: removing.id }); setRemoving(null) }}>{t('remove')}</Button>
            </div>
          </div>
        )}
      </Sheet>

      <Sheet open={confirmWipe} onClose={() => setConfirmWipe(false)} label={t('deleteAll')}>
        <div className="sheet-body">
          <h2 className="h2">{t('deleteAll')}?</h2>
          <p className="lead">{t('deleteConfirm')}</p>
          <div className="sheet-actions">
            <Button variant="secondary" onClick={() => setConfirmWipe(false)}>{t('cancel')}</Button>
            <Button variant="danger" icon={Trash2} onClick={() => { setConfirmWipe(false); wipe() }}>{t('deleteYes')}</Button>
          </div>
        </div>
      </Sheet>
    </div>
  )
}

