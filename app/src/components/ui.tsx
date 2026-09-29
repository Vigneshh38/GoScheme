import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { Check, ChevronLeft, CircleHelp, Info, X } from 'lucide-react'
import type { Tone } from '../data/schemes'
import type { Status } from '../lib/rules'
import { useApp } from '../state'

export function TopBar({ onBack, title, right }: { onBack?: () => void; title?: ReactNode; right?: ReactNode }) {
  const { t } = useApp()
  return (
    <header className="topbar">
      {onBack ? (
        <button type="button" className="icon-btn" onClick={onBack} aria-label={t('back')}>
          <ChevronLeft size={22} />
        </button>
      ) : (
        <span className="icon-btn-space" />
      )}
      <div className="topbar-title">{title}</div>
      <div className="topbar-right">{right}</div>
    </header>
  )
}

type BtnProps = {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  icon?: LucideIcon
  disabled?: boolean
  block?: boolean
  type?: 'button' | 'submit'
}

export function Button({ children, onClick, variant = 'primary', icon: Icon, disabled, block, type = 'button' }: BtnProps) {
  return (
    <button type={type} className={`btn btn--${variant}${block ? ' btn--block' : ''}`} onClick={onClick} disabled={disabled}>
      {Icon && <Icon size={19} strokeWidth={2.3} />}
      <span>{children}</span>
    </button>
  )
}

export function IconTile({ icon: Icon, tone, size = 46 }: { icon: LucideIcon; tone: Tone; size?: number }) {
  return (
    <span className={`tile tone-${tone}`} style={{ width: size, height: size }}>
      <Icon size={Math.round(size * 0.5)} strokeWidth={2.1} />
    </span>
  )
}

export function StatusBadge({ status }: { status: Status }) {
  const { t } = useApp()
  if (status === 'eligible') return <span className="badge badge--ok"><Check size={14} strokeWidth={3} />{t('eligible')}</span>
  if (status === 'maybe') return <span className="badge badge--maybe"><CircleHelp size={14} strokeWidth={2.6} />{t('maybe')}</span>
  return <span className="badge badge--not"><X size={14} strokeWidth={3} />{t('notEligible')}</span>
}

export function Disclaimer() {
  const { t } = useApp()
  return (
    <p className="disclaimer">
      <Info size={13} strokeWidth={2.4} />
      {t('notOfficial')}
    </p>
  )
}

export function Sheet({ open, onClose, children, label }: { open: boolean; onClose: () => void; children: ReactNode; label: string }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            className="sheet"
            role="dialog"
            aria-modal="true"
            aria-label={label}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="sheet-grip" />
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Toast({ text }: { text: string | null }) {
  return (
    <AnimatePresence>
      {text && (
        <motion.div className="toast" role="status" initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 16, opacity: 0 }}>
          <Check size={16} strokeWidth={3} />
          {text}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
