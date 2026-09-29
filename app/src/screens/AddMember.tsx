import { Baby, Heart, UserRound, Users, UsersRound } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { TopBar } from '../components/ui'
import { RELATIONS } from '../i18n'
import { useApp } from '../state'
import type { Relation } from '../types'

const OPTIONS: [Exclude<Relation, 'self'>, LucideIcon][] = [
  ['spouse', Heart],
  ['child', Baby],
  ['parent', UsersRound],
  ['sibling', Users],
  ['other', UserRound],
]

export function AddMember({ onPick, onBack }: { onPick: (r: Relation) => void; onBack: () => void }) {
  const { t, pick } = useApp()
  return (
    <div className="screen">
      <TopBar onBack={onBack} />
      <div className="body">
        <h1 className="h1">{t('whoIsThisFor')}</h1>
        <p className="lead">{t('whoLead')}</p>
        <div className="relation-grid">
          {OPTIONS.map(([rel, Icon]) => (
            <button key={rel} type="button" className="relation" onClick={() => onPick(rel)}>
              <span className="relation-ic"><Icon size={24} /></span>
              {pick(RELATIONS[rel])}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
