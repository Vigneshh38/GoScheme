import { useState } from 'react'
import { Check, Languages } from 'lucide-react'
import { Sheet } from './ui'
import { useApp } from '../state'
import { ACTIVE_LANGS, LANGS } from '../lang'

/** Opens a list of the app languages from any screen. */
export function LangSwitch() {
  const { lang, t } = useApp()
  const [open, setOpen] = useState(false)
  const current = LANGS.find((l) => l.code === lang)!
  return (
    <>
      <button type="button" className="lang-switch" onClick={() => setOpen(true)} aria-label={`${t('language')}: ${current.name}`}>
        <Languages size={16} />
        <span lang={lang}>{current.name}</span>
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} label={t('language')}>
        <div className="sheet-body">
          <h2 className="h2">{t('language')}</h2>
          <LangList onPick={() => setOpen(false)} />
        </div>
      </Sheet>
    </>
  )
}

/** All languages, each written in its own script. */
export function LangList({ onPick }: { onPick?: () => void }) {
  const { lang, dispatch } = useApp()
  return (
    <div className="lang-menu">
      {ACTIVE_LANGS.map((l) => (
        <button key={l.code} type="button" className={l.code === lang ? 'on' : ''} lang={l.code}
          onClick={() => { dispatch({ type: 'lang', lang: l.code }); onPick?.() }}>
          {l.name}
          <small>{l.code === 'en' ? '' : l.en}</small>
          {l.code === lang && <Check size={18} />}
        </button>
      ))}
    </div>
  )
}
