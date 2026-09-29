import { motion } from 'framer-motion'
import { Orb } from '../components/Orb'
import { Disclaimer } from '../components/ui'
import { Logo } from '../components/Logo'
import { useApp } from '../state'
import type { Lang } from '../types'

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
        <button type="button" className="lang-card" onClick={() => choose('ta')}>
          <span className="lang-glyph ta">த</span>
          <span className="lang-name ta">தமிழ்</span>
          <span className="lang-en">Tamil</span>
        </button>
        <button type="button" className="lang-card" onClick={() => choose('en')}>
          <span className="lang-glyph">A</span>
          <span className="lang-name">English</span>
          <span className="lang-en">ஆங்கிலம்</span>
        </button>
      </div>
      <Disclaimer />
    </div>
  )
}
