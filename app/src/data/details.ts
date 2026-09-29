/**
 * Official scheme details (English + Tamil), extracted by `npm run schemes:extract`
 * from myScheme (Government of India) and each scheme's official site.
 */
import raw from './scheme-details.json'
import type { Lang, Text } from '../types'

export type LinkKind = 'form' | 'portal' | 'guidelines' | 'info'

export type SchemeLink = { kind: LinkKind; url: string; title?: string; label?: Text }

export type SchemeDetail = {
  name: string
  department: string
  summary: string
  benefits_md: string
  eligibility_md: string
  exclusions_md: string
  process: { mode: string; md: string }[]
  documents: string[]
}

type Entry = {
  source: { name: string; url: string; checked: string }
  en: SchemeDetail
  ta: SchemeDetail
  links: SchemeLink[]
}

const data = raw as unknown as { generatedAt: string; schemes: Record<string, Entry> }

export function detailsFor(schemeId: string): Entry | undefined {
  return data.schemes[schemeId]
}

export function detailIn(entry: Entry, lang: Lang): SchemeDetail {
  return entry[lang] ?? entry.en
}

/** Forms first, then places to apply, then guidelines. */
export function sortedLinks(entry: Entry): SchemeLink[] {
  const order: Record<LinkKind, number> = { form: 0, portal: 1, guidelines: 2, info: 3 }
  return [...entry.links].sort((a, b) => order[a.kind] - order[b.kind])
}

export function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
