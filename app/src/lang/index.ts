/**
 * Languages. English and Tamil strings sit inline in the code as { en, ta }. Hindi, Telugu
 * and Kannada live in one dictionary per language, keyed by the English text, so adding a
 * string only needs one new line in each dictionary. `npm run lang:check` lists any
 * English string that is missing from a dictionary.
 */
import type { Lang, Text } from '../types'
import hi from './hi.json'
import te from './te.json'
import kn from './kn.json'

export type LangInfo = {
  code: Lang
  /** Name in its own script */
  name: string
  /** Name in English */
  en: string
  /** Letter shown on the language card */
  glyph: string
  /** Speech recognition / synthesis locale */
  locale: string
}

export const LANGS: LangInfo[] = [
  { code: 'ta', name: 'தமிழ்', en: 'Tamil', glyph: 'த', locale: 'ta-IN' },
  { code: 'en', name: 'English', en: 'English', glyph: 'A', locale: 'en-IN' },
  { code: 'hi', name: 'हिन्दी', en: 'Hindi', glyph: 'अ', locale: 'hi-IN' },
  { code: 'te', name: 'తెలుగు', en: 'Telugu', glyph: 'తె', locale: 'te-IN' },
  { code: 'kn', name: 'ಕನ್ನಡ', en: 'Kannada', glyph: 'ಕ', locale: 'kn-IN' },
]

/** Languages shown in the app (all of them; kept separate so one can be hidden quickly). */
export const ACTIVE_LANGS = LANGS

export const localeOf = (lang: Lang): string => LANGS.find((l) => l.code === lang)!.locale

export const DICTS: Record<'hi' | 'te' | 'kn', Record<string, string>> = { hi, te, kn }

/** English text → the same text in `lang` (English if no translation exists). */
export function tr(lang: Lang, en: string): string {
  if (lang === 'en' || lang === 'ta') return en
  return DICTS[lang][en] ?? en
}

export function pickText(text: Text, lang: Lang): string {
  if (lang === 'en' || lang === 'ta') return text[lang]
  return text[lang] ?? DICTS[lang][text.en] ?? text.en
}

/** The same sentence in each language, for code that builds text with a name inside. */
export function say(lang: Lang, en: string, ta: string, vars?: Record<string, string>): string {
  let out = lang === 'ta' ? ta : tr(lang, en)
  if (vars) for (const [k, v] of Object.entries(vars)) out = out.split(`{${k}}`).join(v)
  return out
}
