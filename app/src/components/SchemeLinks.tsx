import { ArrowUpRight, BookOpen, FileText, Globe, Info } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { domainOf, type LinkKind, type SchemeLink } from '../data/details'
import type { StrKey } from '../i18n'
import { useApp } from '../state'

const KIND: Record<LinkKind, [LucideIcon, StrKey]> = {
  form: [FileText, 'kindForm'],
  portal: [Globe, 'kindPortal'],
  guidelines: [BookOpen, 'kindGuidelines'],
  info: [Info, 'kindInfo'],
}

/** Official forms, portals and guidelines for a scheme. */
export function SchemeLinks({ links }: { links: SchemeLink[] }) {
  const { t, pick } = useApp()
  return (
    <ul className="links">
      {links.map((l) => {
        const [Icon, kind] = KIND[l.kind]
        const title = l.label ? pick(l.label) : l.title && !/^https?:/.test(l.title) ? l.title : t(kind)
        return (
          <li key={l.url}>
            <a className={`link link--${l.kind}`} href={l.url} target="_blank" rel="noreferrer">
              <span className="link-ic"><Icon size={18} /></span>
              <span className="link-mid">
                <b>{title}</b>
                <small>{t(kind)} · {domainOf(l.url)}{/\.pdf$/i.test(l.url) ? ' · PDF' : ''}</small>
              </span>
              <ArrowUpRight size={17} className="link-go" />
            </a>
          </li>
        )
      })}
    </ul>
  )
}
