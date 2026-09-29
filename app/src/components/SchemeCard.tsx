import { IconTile, StatusBadge } from './ui'
import type { Match } from '../lib/rules'
import { relationLabel } from '../i18n'
import { useApp } from '../state'

export function SchemeCard({ match, onOpen, onAnswer }: { match: Match; onOpen: () => void; onAnswer?: () => void }) {
  const { t, pick, lang } = useApp()
  const { scheme, best, eligibleMembers } = match
  const status = best.status

  let who: string
  if (scheme.scope === 'household') who = t('wholeFamily')
  else if (eligibleMembers.length > 1) who = t('forWho', { who: eligibleMembers.map((m) => m.name).join(', ') })
  else {
    const m = best.member
    who = m.relation === 'self' ? t('forYou') : `${m.name} · ${relationLabel(m.relation, m.gender, lang)}`
  }

  const failed = best.checks.find((c) => c.state === 'fail')

  return (
    <div className={`card card--${status}`}>
      <button type="button" className="card-main" onClick={onOpen}>
        <IconTile icon={scheme.icon} tone={scheme.tone} />
        <span className="card-mid">
          <span className="card-top">
            <span className="card-name">{pick(scheme.name)}</span>
            <StatusBadge status={status} />
          </span>
          <span className="card-benefit">{pick(scheme.benefit)}</span>
          {status === 'not' && failed ? (
            <span className="card-reason">{pick(failed.rule.need)}</span>
          ) : (
            <span className="card-who">{who}</span>
          )}
        </span>
      </button>
      {status === 'maybe' && onAnswer && (
        <button type="button" className="card-answer" onClick={onAnswer}>
          {t('answerOneQuestion')}
        </button>
      )}
    </div>
  )
}
