import { motion } from 'framer-motion'
import { Orb } from '../components/Orb'
import { Disclaimer } from '../components/ui'
import { Logo } from '../components/Logo'
import { useApp } from '../state'
import type { Lang } from '../types'
import { ACTIVE_LANGS } from '../lang'

export function Welcome({ onChoose }: { onChoose: (lang: Lang) => void }) {
  const { dispatch } = useApp()
  const choose = (lang: Lang) => {
    dispatch({ type: 'lang', lang })
    onChoose(lang)
  }
  return (
    <div className="screen screen--center welcome">
      <Logo />
      <div className="welcome-hero">
        <Orb phase="idle" size={150} label="GoScheme" />
        <motion.h1 className="welcome-greet" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <span className="ta">வணக்கம்</span>
          <span className="welcome-dot">·</span>
          Hello
          <small className="welcome-more">नमस्ते · నమస్కారం · ನಮಸ್ಕಾರ</small>
        </motion.h1>
        <p className="welcome-sub">
          <span className="ta">அரசுத் திட்டங்கள், உங்கள் குரலில்</span>
          <br />
          Government schemes, found by voice
        </p>
      </div>

      <div className="lang-pick">
        <p className="lang-pick-label">
          <span className="ta">மொழியைத் தேர்ந்தெடுக்கவும்</span>
          <br />
          Choose your language
        </p>
        {ACTIVE_LANGS.map((l, i) => (
          // Tamil and English as big cards, the other languages in a row below.
          <button key={l.code} type="button" className={`lang-card${i > 1 ? ' lang-card--sm' : ''}`} lang={l.code} onClick={() => choose(l.code)}>
            <span className="lang-glyph">{l.glyph}</span>
            <span className="lang-name">{l.name}</span>
            <span className="lang-en">{l.code === 'en' ? 'ஆங்கிலம்' : l.en}</span>
          </button>
        ))}
      </div>
      <Disclaimer />
    </div>
  )
}
