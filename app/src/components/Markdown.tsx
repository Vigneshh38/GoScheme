/**
 * Renders the small markdown subset used in official scheme text: headings, numbered and
 * bulleted lists (bullets under a numbered step become a sub-list), **bold**, [links](url)
 * and bare URLs. Builds React elements (no raw HTML), so fetched text can't inject markup.
 */
import type { ReactNode } from 'react'
import { domainOf } from '../data/details'

type Item = { text: string; sub: string[] }
type Block = { type: 'h'; text: string } | { type: 'p'; text: string } | { type: 'list'; ordered: boolean; items: Item[] }

function blocks(md: string): Block[] {
  const out: Block[] = []
  for (const rawLine of md.split('\n')) {
    const line = rawLine.trim()
    if (!line) continue
    const numbered = line.match(/^\d+[.)]\s+(.*)$/)
    const bullet = line.match(/^[-*•]\s+(.*)$/)
    const last = out[out.length - 1]
    if (numbered || bullet) {
      const text = (numbered ?? bullet)![1]
      if (bullet && last?.type === 'list' && last.ordered) last.items[last.items.length - 1].sub.push(text)
      else if (last?.type === 'list' && last.ordered === !!numbered) last.items.push({ text, sub: [] })
      else out.push({ type: 'list', ordered: !!numbered, items: [{ text, sub: [] }] })
      continue
    }
    const heading = line.match(/^#{1,6}\s+(.*)$/)
    if (heading) out.push({ type: 'h', text: heading[1] })
    else out.push({ type: 'p', text: line })
  }
  return out
}

function inline(text: string, key = 0): ReactNode[] {
  const nodes: ReactNode[] = []
  const re = /\*\*([^*]+)\*\*|\[([^\]]*)\]\(([^)\s]+)\)|(https?:\/\/[^\s)]+|www\.[^\s)]+)/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index))
    if (m[1] !== undefined) nodes.push(<b key={`${key}-${m.index}`}>{m[1]}</b>)
    else {
      const url = (m[3] ?? m[4]).replace(/[.,]$/, '')
      const href = url.startsWith('http') ? url : `https://${url}`
      const label = m[2] && !/^https?:\/\//.test(m[2]) ? m[2] : domainOf(href)
      nodes.push(<a key={`${key}-${m.index}`} href={href} target="_blank" rel="noreferrer">{label}</a>)
    }
    last = m.index + m[0].length
  }
  if (last < text.length) nodes.push(text.slice(last))
  // Leftover unpaired bold markers from translation
  return nodes.map((n) => (typeof n === 'string' ? n.replace(/\*\*/g, '') : n))
}

export function Markdown({ md, steps }: { md: string; steps?: boolean }) {
  return (
    <div className="md">
      {blocks(md).map((b, i) => {
        if (b.type === 'h') return <h4 key={i}>{inline(b.text)}</h4>
        if (b.type === 'p') return <p key={i}>{inline(b.text)}</p>
        const List = steps && b.ordered ? 'ol' : 'ul'
        return (
          <List key={i} className={steps && b.ordered ? 'md-steps' : 'md-list'}>
            {b.items.map((it, j) => (
              <li key={j}>
                {inline(it.text, j)}
                {it.sub.length > 0 && (
                  <ul className="md-list md-sub">{it.sub.map((s, k) => <li key={k}>{inline(s, k)}</li>)}</ul>
                )}
              </li>
            ))}
          </List>
        )
      })}
    </div>
  )
}
