// Lists every English string the app can show that is missing from the Hindi, Telugu or
// Kannada dictionary (src/lang/hi.json, te.json, kn.json). Usage: npm run lang:check
//   --dump   also writes the full list of English strings to lang-strings.json
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createServer } from 'vite'

const found = new Set()
const add = (s) => { if (typeof s === 'string' && s.trim() && /[a-z]/i.test(s)) found.add(s) }

// 1. Runtime: every { en, ta } object reachable from the app's data, and every question.
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
let DICTS
try {
  const load = (p) => server.ssrLoadModule(p)
  const [i18n, schemes, questions, portals, lang] = await Promise.all([
    load('/src/i18n.ts'), load('/src/data/schemes.ts'), load('/src/data/questions.ts'), load('/src/portal/portals.ts'), load('/src/lang/index.ts'),
  ])
  DICTS = lang.DICTS
  const seen = new Set()
  const walk = (v) => {
    if (!v || typeof v !== 'object' || seen.has(v)) return
    seen.add(v)
    if (typeof v.en === 'string' && typeof v.ta === 'string') {
      // Inline translations need no dictionary entry.
      if (!('hi' in v)) add(v.en)
      return
    }
    for (const x of Array.isArray(v) ? v : Object.values(v)) walk(x)
  }
  walk(i18n.STRINGS); walk(i18n.OCCUPATIONS); walk(i18n.GENDERS); walk(i18n.RELATIONS)
  walk(schemes.SCHEMES); walk(schemes.DOCS); walk(portals.PORTALS); walk(questions.QUESTIONS)
  for (const q of Object.values(questions.QUESTIONS)) {
    for (const self of [true, false]) {
      add(q.say('en', self))
      add(q.ask('en', { self, name: '{name}' }))
    }
  }
  // Rules evaluate to { en, ta } texts through functions; call them with an empty profile.
  for (const s of schemes.SCHEMES) for (const r of s.rules) for (const k of ['need', 'fix']) {
    const t = typeof r[k] === 'function' ? r[k]({}, {}) : r[k]
    if (t) walk(t)
  }
} finally {
  await server.close()
}

// 2. Source: say(lang, 'English', 'Tamil') calls, parse errors and label pairs.
const files = []
const scan = (dir) => {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f)
    if (statSync(p).isDirectory()) { if (f !== 'lang') scan(p) } else if (/\.tsx?$/.test(f)) files.push(p)
  }
}
scan('src')
const str = `'((?:[^'\\\\]|\\\\.)*)'|"((?:[^"\\\\]|\\\\.)*)"`
const patterns = [
  new RegExp(`\\bsay\\(\\s*\\w+,\\s*(?:${str})`, 'g'),
  new RegExp(`\\bfail\\(\\s*(?:${str})`, 'g'),
  new RegExp(`\\b\\w+: \\[(?:${str}),\\s*'[^']*[\\u0B80-\\u0BFF]`, 'g'),
  new RegExp(`\\ben: (?:${str}),\\s*ta:`, 'g'),
]
for (const p of files) {
  // Districts carry their names in every language inline.
  if (p.endsWith('districts.ts')) continue
  const src = readFileSync(p, 'utf8')
  for (const re of patterns) for (const m of src.matchAll(re)) {
    // A line that already has a Hindi value is translated inline.
    const line = src.slice(src.lastIndexOf('\n', m.index) + 1, src.indexOf('\n', m.index))
    if (/\bhi: /.test(line)) continue
    const s = (m[1] ?? m[2]).replace(/\\'/g, "'").replace(/\\"/g, '"')
    if (!/\$\{/.test(s)) add(s)
  }
}

const all = [...found].sort()
if (process.argv.includes('--dump')) writeFileSync('lang-strings.json', JSON.stringify(all, null, 1) + '\n')
let missing = 0
for (const [code, dict] of Object.entries(DICTS)) {
  const gaps = all.filter((s) => !(s in dict))
  missing += gaps.length
  if (gaps.length) console.log(`\n${code}: ${gaps.length} missing\n` + gaps.map((s) => '  ' + JSON.stringify(s)).join('\n'))
  // Placeholders like {n} must survive translation.
  for (const [en, out] of Object.entries(dict)) {
    const want = (en.match(/\{\w+\}/g) ?? []).sort().join()
    const got = (out.match(/\{\w+\}/g) ?? []).sort().join()
    if (want !== got) { missing++; console.log(`${code}: placeholders differ in ${JSON.stringify(en)} → ${JSON.stringify(out)}`) }
  }
}
console.log(`\n${all.length} English strings; ${missing ? missing + ' problems' : 'every language complete'}`)
process.exitCode = missing ? 1 : 0
