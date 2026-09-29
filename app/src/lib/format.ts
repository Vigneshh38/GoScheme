import type { HouseholdFacts, Lang, Member } from '../types'
import type { QuestionKey } from '../data/questions'
import { HOUSEHOLD_KEYS } from '../data/questions'
import { GENDERS, OCCUPATIONS, formatIncome, translate, type StrKey } from '../i18n'
import { districtByName } from '../data/districts'

export const ANSWER_LABEL: Partial<Record<QuestionKey, StrKey>> = {
  name: 'fName', age: 'fAge', gender: 'fGender', occupation: 'fOccupation',
  income: 'fIncome', district: 'fDistrict', familySize: 'fFamilySize',
}

export function isHouseholdKey(key: QuestionKey): boolean {
  return (HOUSEHOLD_KEYS as string[]).includes(key)
}

export function rawAnswer(key: QuestionKey, m: Member, h: HouseholdFacts): unknown {
  if (key === 'name') return m.name || undefined
  return isHouseholdKey(key) ? h[key as keyof HouseholdFacts] : m[key as keyof Member]
}

/** Human-readable answer, e.g. "45 years", "₹2.3 lakh", "மதுரை". */
export function formatAnswer(key: QuestionKey, m: Member, h: HouseholdFacts, lang: Lang): string {
  return formatValue(key, rawAnswer(key, m, h), lang)
}

/** One answer as people read it: 21 → "21 years", 200000 → "₹2 lakh", true → "Yes". */
export function formatValue(key: QuestionKey, v: unknown, lang: Lang): string {
  if (v === undefined || v === '') return '—'
  switch (key) {
    case 'age': return translate(lang, 'years', { n: v as number })
    case 'gender': return GENDERS[v as Member['gender'] & string][lang]
    case 'occupation': return OCCUPATIONS[v as Member['occupation'] & string][lang]
    case 'income': return formatIncome(v as number, lang)
    case 'district': return districtByName(v as string)?.[lang] ?? String(v)
    case 'familySize': return translate(lang, 'people', { n: v as number })
    default:
      if (typeof v === 'boolean') return translate(lang, v ? 'yes' : 'no')
      return String(v)
  }
}

/** Initial letter for the round avatar; works for Tamil names too. */
export function initial(name: string): string {
  return Array.from(name.trim())[0]?.toUpperCase() ?? '?'
}
