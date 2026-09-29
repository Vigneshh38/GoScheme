import { Languages } from 'lucide-react'
import { useApp } from '../state'

/** Switches between Tamil and English from any screen. */
export function LangSwitch() {
  const { lang, dispatch } = useApp()
  const next = lang === 'ta' ? 'en' : 'ta'
  return (
    <button
      type="button"
      className="lang-switch"
      onClick={() => dispatch({ type: 'lang', lang: next })}
      aria-label={next === 'ta' ? 'Switch to Tamil' : 'ஆங்கிலத்திற்கு மாறு'}
    >
      <Languages size={16} />
      <span className={next === 'ta' ? 'ta' : ''}>{next === 'ta' ? 'தமிழ்' : 'English'}</span>
    </button>
  )
}
