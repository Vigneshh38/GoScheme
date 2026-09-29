import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, CircleHelp, FileText, Lightbulb, X } from 'lucide-react'
import { Button, Disclaimer, IconTile, StatusBadge, Toast, TopBar } from '../components/ui'
import { MaybeSheet } from '../components/MaybeSheet'
import { Markdown } from '../components/Markdown'
import { SchemeLinks } from '../components/SchemeLinks'
import { DOCS, schemeById } from '../data/schemes'
import { detailIn, detailsFor, sortedLinks } from '../data/details'
import { evaluate, type Evaluation } from '../lib/rules'
import { relationLabel, type StrKey } from '../i18n'
import { initial } from '../lib/format'
import { useApp } from '../state'

type Props = { schemeId: string; memberId?: string; onBack: () => void; onApply: (memberId: string) => void }
type Tab = 'overview' | 'eligibility' | 'apply'
const TABS: [Tab, StrKey][] = [['overview', 'tabOverview'], ['eligibility', 'tabEligibility'], ['apply', 'tabApply']]

export function SchemeDetail({ schemeId, memberId, onBack, onApply }: Props) {
  const { state, t, pick, lang, owner } = useApp()
  const scheme = schemeById(schemeId)
  const entry = detailsFor(schemeId)
  const [who, setWho] = useState(memberId ?? owner?.id)
  const [tab, setTab] = useState<Tab>('overview')
  const [asking, setAsking] = useState<Evaluation | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  if (!scheme) return null

  const people = scheme.scope === 'household' ? state.members.filter((m) => m.relation === 'self') : state.members
  const evals = people.map((m) => evaluate(scheme, m, state.household))
  const ev = evals.find((e) => e.member.id === who) ?? evals[0]
  if (!ev) return null
  const fixes = ev.checks.filter((c) => c.state === 'fail' && c.rule.fix)
  const detail = entry && detailIn(entry, lang)
  const date = entry ? new Date(entry.source.checked).toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

  return (
    <div className="screen">
      <TopBar onBack={onBack} />
      <div className="body detail">
        <header className="detail-head">
          <IconTile icon={scheme.icon} tone={scheme.tone} size={52} />
          <div>
            <h1 className="detail-name">{pick(scheme.name)}</h1>
            <p className="detail-by">{detail?.department || pick(scheme.by)}</p>
          </div>
        </header>

        <p className="detail-benefit">{pick(scheme.benefit)}</p>

        <div className="detail-status">
          <StatusBadge status={ev.status} />
          <span>
            {scheme.scope === 'household' ? t('wholeFamily') : `${ev.member.name} · ${relationLabel(ev.member.relation, ev.member.gender, lang)}`}
          </span>
        </div>

        {people.length > 1 && (
          <div className="chips chips--wrap">
            {evals.map((e) => (
              <button key={e.member.id} type="button" className={`chip${e.member.id === ev.member.id ? ' chip--on' : ''}`} onClick={() => setWho(e.member.id)}>
                <span className={`chip-dot dot-${e.member.relation}`}>{initial(e.member.name)}</span>
                {e.member.name}
                <i className={`status-dot sd-${e.status}`} />
              </button>
            ))}
          </div>
        )}

        <nav className="seg seg--tabs" aria-label={pick(scheme.name)}>
          {TABS.map(([id, label]) => (
            <button key={id} type="button" className={tab === id ? 'on' : ''} onClick={() => setTab(id)} aria-pressed={tab === id}>
              {t(label)}
            </button>
          ))}
        </nav>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}>
            {tab === 'overview' && (
              <>
                <section className="sec">
                  <h2 className="sec-title">{t('yourCheck')}</h2>
                  <ul className="checks">
                    {ev.checks.map((c, i) => (
                      <li key={i} className={`check check--${c.state}`}>
                        <span className="check-ic">
                          {c.state === 'pass' ? <Check size={13} strokeWidth={3} /> : c.state === 'fail' ? <X size={13} strokeWidth={3} /> : <CircleHelp size={13} strokeWidth={2.6} />}
                        </span>
                        {pick(c.rule.need)}
                      </li>
                    ))}
                  </ul>
                  {ev.status === 'not' && fixes.length > 0 && (
                    <div className="fix">
                      <p className="fix-title"><Lightbulb size={16} /> {t('howToFix')}</p>
                      {fixes.map((c, i) => <p key={i}>{pick(c.rule.fix!)}</p>)}
                    </div>
                  )}
                </section>
                {detail?.benefits_md && (
                  <section className="sec">
                    <h2 className="sec-title">{t('benefitsTitle')}</h2>
                    <Markdown md={detail.benefits_md} />
                  </section>
                )}
                {detail?.summary && (
                  <section className="sec">
                    <h2 className="sec-title">{t('aboutTitle')}</h2>
                    <p className="sec-text">{detail.summary}</p>
                  </section>
                )}
              </>
            )}

            {tab === 'eligibility' && detail && (
              <>
                <section className="sec">
                  <h2 className="sec-title">{t('officialRules')}</h2>
                  <Markdown md={detail.eligibility_md} />
                </section>
                {detail.exclusions_md && (
                  <section className="sec">
                    <h2 className="sec-title">{t('exclusionsTitle')}</h2>
                    <Markdown md={detail.exclusions_md} />
                  </section>
                )}
              </>
            )}

            {tab === 'apply' && (
              <>
                {detail?.process.map((p, i) => (
                  <section key={i} className="sec">
                    <h2 className="sec-title">{t('stepsTitle')}{p.mode ? ` · ${p.mode}` : ''}</h2>
                    <Markdown md={p.md} steps />
                  </section>
                ))}
                {entry && entry.links.length > 0 && (
                  <section className="sec">
                    <h2 className="sec-title">{t('formsLinks')}</h2>
                    <SchemeLinks links={sortedLinks(entry)} />
                  </section>
                )}
                <section className="sec">
                  <h2 className="sec-title">{t('docsNeeded')}</h2>
                  <ul className="docs">
                    {(detail?.documents.length ? detail.documents : scheme.documents.map((d) => pick(DOCS[d]))).map((d) => (
                      <li key={d}><FileText size={16} /> {d}</li>
                    ))}
                  </ul>
                </section>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {entry && (
          <p className="source">
            {t('sourceLine', { name: entry.source.name, date })} ·{' '}
            <a href={entry.source.url} target="_blank" rel="noreferrer">{t('officialSite')}</a>
            {lang === 'ta' && entry.source.name.startsWith('myScheme') && <><br />{t('translatedBy')}</>}
          </p>
        )}
        <p className="fineprint">{t('demoRules')}</p>
        <Disclaimer />
      </div>

      {ev.status !== 'not' && (
        <footer className="footer">
          {ev.status === 'eligible' ? (
            <Button block onClick={() => onApply(ev.member.id)}>{t('fillApplication')}</Button>
          ) : (
            <Button block variant="secondary" onClick={() => setAsking(ev)}>{t('answerOneQuestion')}</Button>
          )}
        </footer>
      )}

      <MaybeSheet ev={asking} onClose={() => setAsking(null)} onResult={(text) => { setToast(`${t('updated')} — ${text}`); setTimeout(() => setToast(null), 2600) }} />
      <Toast text={toast} />
    </div>
  )
}
