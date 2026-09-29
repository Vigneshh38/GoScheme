/**
 * Every sentence the app speaks aloud. `npm run voice:lines` exports this list, the
 * generator in tools/tts records each one in a natural voice, and the app plays the
 * recording instead of the browser's robotic voice.
 */
import type { Lang } from '../types'
import { translate } from '../i18n'
import { QUESTIONS, OWNER_FLOW, MEMBER_FLOW, type QuestionKey } from './questions'
import { SCHEMES } from './schemes'

export type VoiceLine = { lang: Lang; text: string }

/** Questions that can be about a family member (asked with "they"). */
const MEMBER_KEYS: QuestionKey[] = [...MEMBER_FLOW, 'ownsLand', 'studiedGovtSchool', 'isHeadOfFamily', 'hasBankAccount']

export function voiceLines(): VoiceLine[] {
  const out: VoiceLine[] = []
  for (const lang of ['ta', 'en'] as Lang[]) {
    out.push({ lang, text: translate(lang, 'intro') }, { lang, text: translate(lang, 'sayAgain') })
    const keys = new Set<QuestionKey>([...OWNER_FLOW, ...(Object.keys(QUESTIONS) as QuestionKey[])])
    for (const key of keys) {
      out.push({ lang, text: QUESTIONS[key].say(lang, true) })
      if (MEMBER_KEYS.includes(key)) out.push({ lang, text: QUESTIONS[key].say(lang, false) })
    }
    for (const s of SCHEMES) for (const f of s.fields) if (f.voice) out.push({ lang, text: f.voice.ask[lang] })
  }
  const seen = new Set<string>()
  return out.filter((l) => {
    const k = `${l.lang}|${l.text}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}
