import { motion } from 'framer-motion'
import { useState } from 'react'
import { BellRing, Check, Copy, Download, Send, ThumbsUp, X as XIcon } from 'lucide-react'
import { Button, IconTile, TopBar } from '../components/ui'
import { schemeById } from '../data/schemes'
import { detailsFor, sortedLinks } from '../data/details'
import { SchemeLinks } from '../components/SchemeLinks'
import { useApp } from '../state'
import { localeOf } from '../lang'
import type { FormStatus } from '../types'
import { cancelReminder, remindDate, scheduleReminder } from '../lib/reminders'

// Inside a Claude Artifact printing is blocked, so offer copying instead.
const IN_ARTIFACT = import.meta.env.MODE === 'artifact'

/** The finished form: a printable sheet the user saves as PDF and takes to submit. */
export function FormView({ formId, fresh, onBack, onHome }: { formId: string; fresh: boolean; onBack: () => void; onHome: () => void }) {
  const { state, t, pick, lang, dispatch } = useApp()
  const form = state.forms.find((f) => f.id === formId)
  const scheme = form && schemeById(form.schemeId)
  const member = form && state.members.find((m) => m.id === form.memberId)
  const [copied, setCopied] = useState(false)
  if (!form || !scheme) return null
  const entry = detailsFor(scheme.id)
  // Where to hand the form in: official forms and portals only.
  const links = entry ? sortedLinks(entry).filter((l) => l.kind === 'form' || l.kind === 'portal') : []
  const copy = () => {
    const text = [
      `${pick(scheme.name)} — ${member?.name ?? ''}`,
      ...form.fields.map((f) => `${f.label}: ${f.value}`),
      '',
      `${t('carry')}: ${form.documents.join(', ')}`,
      ...links.map((l) => l.url),
    ].join('\n')
    navigator.clipboard?.writeText(text).then(() => setCopied(true), () => setCopied(false))
  }
  const date = new Date(form.createdAt).toLocaleDateString(localeOf(lang), { day: 'numeric', month: 'long', year: 'numeric' })
  const status = form.status ?? 'ready'
  const setStatus = (next: FormStatus) => {
    if (next === 'submitted') {
      const now = Date.now()
      const at = remindDate(now)
      dispatch({ type: 'formStatus', id: form.id, patch: { status: next, submittedAt: now, remindAt: at } })
      void scheduleReminder(form.id, at, t('remindTitle'), t('remindBody', { scheme: pick(scheme.name) }))
    } else {
      dispatch({ type: 'formStatus', id: form.id, patch: { status: next, remindAt: undefined } })
      void cancelReminder(form.id)
    }
  }
  const STEPS: [FormStatus, typeof Send, string][] = [
    ['ready', Check, t('formReadyTag')], ['submitted', Send, t('stSubmitted')], ['approved', ThumbsUp, t('stApproved')], ['rejected', XIcon, t('stRejected')],
  ]

  return (
    <div className="screen">
      <TopBar onBack={onBack} />
      <div className="body">
        {fresh && (
          <div className="done-hero">
            <motion.span className="done-check" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 12 }}>
              <Check size={34} strokeWidth={3} />
            </motion.span>
            <h1 className="h1">{t('formReady')}</h1>
            <p className="lead">{t(IN_ARTIFACT ? 'formReadyLeadCopy' : 'formReadyLead')}</p>
          </div>
        )}

        <article className="print-sheet">
          <header className="ps-head">
            <IconTile icon={scheme.icon} tone={scheme.tone} size={40} />
            <div>
              <b>{pick(scheme.name)}</b>
              <span>{pick(scheme.by)}</span>
            </div>
            <span className="ps-brand">GoScheme</span>
          </header>
          <p className="ps-meta">{member?.name} · {date}</p>
          <table className="ps-table">
            <tbody>
              {form.fields.map((f) => (
                <tr key={f.label}>
                  <th>{f.label}</th>
                  <td>{f.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="ps-docs-title">{t('carry')}</p>
          <ul className="ps-docs">
            {form.documents.map((d) => <li key={d}>☐ {d}</li>)}
          </ul>
          {links.length > 0 && (
            <>
              <p className="ps-docs-title">{t('whereToSubmit')}</p>
              <ul className="ps-docs">
                {links.map((l) => <li key={l.url}>{l.url}</li>)}
              </ul>
            </>
          )}
          <p className="ps-foot">{t('notOfficial')}. {t('demoRules')}</p>
        </article>

        <section className="sec">
          <h2 className="sec-title">{t('statusTitle')}</h2>
          <p className="status-lead">{t('statusLead')}</p>
          <div className="status-steps">
            {STEPS.map(([key, Icon, label]) => (
              <button key={key} type="button" className={`status-step status-step--${key}${status === key ? ' on' : ''}`} onClick={() => setStatus(key)} aria-pressed={status === key}>
                <Icon size={16} />{label}
              </button>
            ))}
          </div>
          {status === 'submitted' && form.remindAt && (
            <p className="status-note"><BellRing size={15} />{t('remindOn', { date: new Date(form.remindAt).toLocaleDateString(localeOf(lang), { day: 'numeric', month: 'long' }) })}</p>
          )}
          {status === 'rejected' && <p className="status-note status-note--bad">{t('rejectedLead')}</p>}
        </section>

        {links.length > 0 && (
          <section className="sec">
            <h2 className="sec-title">{t('whereToSubmit')}</h2>
            <SchemeLinks links={links} />
          </section>
        )}
      </div>
      <footer className="footer">
        {IN_ARTIFACT ? (
          <Button block icon={copied ? Check : Copy} onClick={copy}>{copied ? t('copied') : t('copyDetails')}</Button>
        ) : (
          <Button block icon={Download} onClick={() => window.print()}>{t('savePdf')}</Button>
        )}
        {fresh && <Button block variant="ghost" onClick={onHome}>{t('backToSchemes')}</Button>}
      </footer>
    </div>
  )
}
