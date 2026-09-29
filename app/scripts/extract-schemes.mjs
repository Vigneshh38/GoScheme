// Pulls official scheme details (English + Tamil) into src/data/scheme-details.json.
//
//   npm run schemes:extract
//
// Sources
// - myScheme (Government of India, MeitY): the public data the scheme pages themselves load
//   (served through API Setu). robots.txt allows crawling; we fetch politely, one page at a time.
// - scripts/manual-schemes.json: facts copied from the official site of each scheme that is
//   not on myScheme (each entry keeps its source link).
import { readFileSync, writeFileSync } from 'node:fs'

const BASE = 'https://www.myscheme.gov.in'

/** app scheme id → where its details come from */
const SOURCES = {
  'pm-kisan': { myscheme: 'pm-kisan' },
  cmchis: { myscheme: 'cmchis' },
  kmut: { manual: true },
  'pudhumai-penn': { myscheme: 'pudhumai-penn-scheme' },
  'tamil-pudhalvan': { manual: true },
  'pmay-g': { myscheme: 'pmay-g' },
  'old-age-pension': { myscheme: 'ignoapstn' },
  ujjwala: { myscheme: 'pmuy' },
  pmjjby: { myscheme: 'pmjjby' },
  'e-shram': { manual: true },
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function getJson(path) {
  const res = await fetch(BASE + path, {
    headers: { Accept: 'application/json', 'User-Agent': 'GoScheme student project (expo prototype)' },
  })
  if (!res.ok) throw new Error(`${res.status} for ${path}`)
  const body = await res.json()
  if (body.status !== 'Success') throw new Error(`myScheme said ${body.status} for ${path}`)
  await sleep(400)
  return body.data
}

const ENTITIES = { '&#39;': "'", '&quot;': '"', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&nbsp;': ' ' }

// Known machine-translation slips in myScheme's Tamil text.
const TA_FIXES = [['ராமதீர்தம்', 'ராமாமிர்தம்']]

/** Tidy myScheme markdown: HTML entities, stray escapes, bold markers broken by translation ("* *"),
 *  list items that the Tamil translation joined onto one line, and nested-list indentation. */
function cleanMd(md = '') {
  for (const [bad, good] of TA_FIXES) md = md.split(bad).join(good)
  return md
    .replace(/&#39;|&quot;|&amp;|&lt;|&gt;|&nbsp;/g, (m) => ENTITIES[m])
    .replace(/\\([*_#\-.])/g, '$1') // unescape first, so the patterns below see plain "**"
    .replace(/\*\s\*/g, '**') // bold markers split by translation: "* *" → "**"
    // "[url] (url)" — a link broken by translation
    .replace(/\]\s+\(/g, '](')
    // A leading "Offline" / "Online" label repeats the mode we already show.
    .replace(/^\s*\*{0,2}\s*(Offline|Online|ஆஃப்லைன்|ஆ:ப்லைன்|ஆன்லைன்)\s*\*{0,2}\s*/i, '')
    // "**Step 01:**", "* படி 01: **", "படி 2:" → numbered list items
    .replace(/\s*\*{0,2}\s*\*?\s*(?:Step|படி)\s*0?\d+\s*[:：]\s*\*{0,2}\s*/g, '\n1. ')
    .replace(/^\s*\**\s*(Offline|Online|ஆஃப்லைன்|ஆ:ப்லைன்|ஆன்லைன்)\s*\**\s*$/gim, '')
    .replace(/^1\.\s+\*+\s*/gm, '1. ')
    .replace(/([^\n])[ \t]+1\.[ \t]+/g, '$1\n1. ')
    .replace(/([.:;])1\.[ \t]+/g, '$1\n1. ') // "years.1. It covers"
    .replace(/^[ \t]+/gm, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** myScheme rich text (paragraphs, lists) → simple markdown, for fields that have no *_md copy. */
function richToMd(nodes = []) {
  const text = (n) => (typeof n.text === 'string' ? (n.bold ? `**${n.text}**` : n.text) : (n.children ?? []).map(text).join(''))
  const lines = []
  const walk = (n) => {
    if (n.type === 'list_item') lines.push('1. ' + text(n).trim())
    else if (n.type === 'paragraph' || /^heading/.test(n.type ?? '')) { const t = text(n).trim(); if (t) lines.push(t) }
    else for (const c of n.children ?? []) walk(c)
  }
  for (const n of nodes) walk(n)
  return lines.join('\n')
}

const label = (v) => (v && typeof v === 'object' ? v.label ?? v.value ?? '' : v ?? '')

/** Flatten myScheme's rich-text document list into plain lines. */
function documentLines(nodes = []) {
  const out = []
  const walk = (n) => {
    if (n.type === 'list_item') {
      const text = collect(n).trim()
      if (text) out.push(text.replace(/\.$/, ''))
      return
    }
    for (const c of n.children ?? []) walk(c)
  }
  const collect = (n) => (typeof n.text === 'string' ? n.text : (n.children ?? []).map(collect).join(''))
  for (const n of nodes) walk(n)
  return out
}

function linksFrom(detail) {
  const found = []
  const add = (url, title) => {
    url = url.trim().replace(/#.*$/, '').replace(/[).,]+$/, '')
    if (!/^https?:\/\//.test(url)) url = 'https://' + url.replace(/^\/+/, '')
    if (found.some((l) => l.url === url)) return
    const isPdf = /\.pdf$/i.test(url)
    const statusPage = /know|status|check|track/i.test(url + ' ' + title)
    const formish = !statusPage && /form|applica|consent|declar|annex|registration/i.test(url + ' ' + title)
    const kind = formish ? 'form' : isPdf ? 'guidelines' : 'portal'
    found.push({ kind, url, title: title.trim() })
  }
  for (const p of detail.process) {
    for (const m of p.md.matchAll(/\[([^\]]*)\]\(([^)\s]+)\)/g)) add(m[2], m[1])
  }
  for (const r of detail.references) if (r.url) add(r.url, r.title ?? '')
  return found
}

async function fromMyScheme(slug) {
  const out = { source: { name: 'myScheme (Government of India)', url: `${BASE}/schemes/${slug}`, checked: new Date().toISOString().slice(0, 10) } }
  for (const lang of ['en', 'ta']) {
    const data = await getJson(`/api/apisetu/schemes?slug=${encodeURIComponent(slug)}&lang=${lang}`)
    const d = data[lang] ?? data.en
    const docs = await getJson(`/api/apisetu/schemes/${data._id}/documents?lang=${lang}`).catch(() => null)
    const basic = d.basicDetails ?? {}
    const content = d.schemeContent ?? {}
    out[lang] = {
      name: basic.schemeName,
      department: label(basic.nodalDepartmentName) || label(basic.nodalMinistryName),
      summary: cleanMd(content.briefDescription),
      benefits_md: cleanMd(content.benefits_md || richToMd(content.benefits)),
      eligibility_md: cleanMd(d.eligibilityCriteria?.eligibilityDescription_md || richToMd(d.eligibilityCriteria?.eligibilityDescription)),
      exclusions_md: cleanMd(content.exclusions_md),
      process: (d.applicationProcess ?? []).map((p) => ({ mode: p.mode ?? '', md: cleanMd(p.process_md) })).filter((p) => p.md),
      documents: documentLines(docs?.[lang]?.documents_required ?? docs?.en?.documents_required),
      references: (content.references ?? []).map((r) => ({ title: r.title ?? '', url: (r.url ?? '').trim() })),
    }
  }
  out.links = linksFrom(out.en)
  for (const lang of ['en', 'ta']) delete out[lang].references
  return out
}

const manual = JSON.parse(readFileSync(new URL('./manual-schemes.json', import.meta.url), 'utf8'))
const schemes = {}
for (const [id, src] of Object.entries(SOURCES)) {
  if (src.manual) {
    const m = manual[id]
    schemes[id] = { source: { name: m.sourceName, url: m.sourceUrl, checked: m.checked }, en: m.en, ta: m.ta, links: m.links }
    console.log(`✓ ${id} (official site, curated)`)
    continue
  }
  try {
    schemes[id] = await fromMyScheme(src.myscheme)
    // Gaps in myScheme filled from the official source (see manual-schemes.json → _overrides).
    const fix = manual._overrides?.[id]
    if (fix) {
      for (const lang of ['en', 'ta']) Object.assign(schemes[id][lang], fix[lang] ?? {})
      if (fix.links) schemes[id].links = [...schemes[id].links, ...fix.links]
    }
    // Apply the Tamil spelling fixes everywhere, names included.
    let json = JSON.stringify(schemes[id])
    for (const [bad, good] of TA_FIXES) json = json.split(bad).join(good)
    schemes[id] = JSON.parse(json)
    const s = schemes[id]
    console.log(`✓ ${id} ← myScheme/${src.myscheme}: ${s.en.process.length} ways to apply, ${s.en.documents.length} documents, ${s.links.length} links`)
  } catch (e) {
    console.error(`✗ ${id}: ${e.message}`)
    process.exitCode = 1
  }
}

const out = new URL('../src/data/scheme-details.json', import.meta.url)
writeFileSync(out, JSON.stringify({ generatedAt: new Date().toISOString(), schemes }, null, 1) + '\n')
console.log(`wrote src/data/scheme-details.json (${Object.keys(schemes).length} schemes)`)
