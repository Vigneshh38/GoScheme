import type { LucideIcon } from 'lucide-react'
import { ListChecks, Lock, Target, Trash2 } from 'lucide-react'
import { Button, Disclaimer, TopBar } from '../components/ui'
import { useApp } from '../state'
import type { StrKey } from '../i18n'

const ROWS: [LucideIcon, StrKey, StrKey][] = [
  [ListChecks, 'consentWhatT', 'consentWhat'],
  [Target, 'consentWhyT', 'consentWhy'],
  [Lock, 'consentWhereT', 'consentWhere'],
  [Trash2, 'consentDeleteT', 'consentDelete'],
]

export function Consent({ onAgree, onBack }: { onAgree: () => void; onBack: () => void }) {
  const { t } = useApp()
  return (
    <div className="screen">
      <TopBar onBack={onBack} />
      <div className="body">
        <h1 className="h1">{t('consentTitle')}</h1>
        <p className="lead">{t('consentLead')}</p>
        <ul className="consent-list">
          {ROWS.map(([Icon, title, text]) => (
            <li key={title}>
              <span className="consent-ic"><Icon size={20} strokeWidth={2.2} /></span>
              <div>
                <b>{t(title)}</b>
                <p>{t(text)}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="fineprint">{t('consentLaw')}</p>
      </div>
      <footer className="footer">
        <Button block onClick={onAgree}>{t('consentAgree')}</Button>
        <Disclaimer />
      </footer>
    </div>
  )
}
