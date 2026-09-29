/**
 * Turns spoken (or typed) answers into clean values. Chrome's speech recognizer usually
 * returns digits ("45"), but people also say numbers as words in Tamil or English, give
 * income as "2 lakh" or "15,000 a month", and name districts by nickname ("Trichy").
 */
import type { Gender, Occupation, Text } from '../types'
import { DISTRICTS } from '../data/districts'

export type Parsed<T> = { ok: true; value: T } | { ok: false; error: Text }

const fail = (en: string, ta: string): { ok: false; error: Text } => ({ ok: false, error: { en, ta } })

function clean(text: string): string {
  return text
    .toLowerCase()
    .replace(/(\d),(?=\d)/g, '$1') // 15,000 → 15000
    .replace(/[,!?।]/g, ' ')
    .replace(/\.(?!\d)/g, ' ') // drop full stops but keep decimals like 2.5
    .replace(/\s+/g, ' ')
    .trim()
}

// ---------- numbers ----------

const EN_UNITS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19,
}
const EN_TENS: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fourty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
}

function englishWordsToNumber(text: string): number | undefined {
  let total = 0
  let current = 0
  let seen = false
  for (const w of clean(text).split(/[\s-]+/)) {
    if (w in EN_UNITS) { current += EN_UNITS[w]; seen = true }
    else if (w in EN_TENS) { current += EN_TENS[w]; seen = true }
    else if (w === 'hundred') { current = (current || 1) * 100; seen = true }
    else if (w === 'thousand') { total += (current || 1) * 1000; current = 0; seen = true }
    else if (w === 'lakh' || w === 'lakhs' || w === 'lac') { total += (current || 1) * 100000; current = 0; seen = true }
  }
  return seen ? total + current : undefined
}

// Tamil numbers change shape when joined (நாற்பது + ஐந்து → நாற்பத்தைந்து), so we look for
// the stems that survive the joining.
const TA_TEENS: [string, number][] = [
  ['பத்தொன்பது', 19], ['பதினெட்டு', 18], ['பதினேழு', 17], ['பதினாறு', 16], ['பதினைந்து', 15],
  ['பதினான்கு', 14], ['பதிமூன்று', 13], ['பன்னிரண்டு', 12], ['பதினொன்று', 11],
]
const TA_TENS: [string, number][] = [
  ['தொண்ணூ', 90], ['எண்ப', 80], ['எழுப', 70], ['அறுப', 60], ['ஐம்ப', 50], ['நாற்ப', 40], ['முப்ப', 30], ['இருப', 20],
]
const TA_UNITS: [string, number][] = [
  ['ன்பது', 9], ['மூன்', 3], ['ன்று', 1], ['ஒரு', 1], ['ரண்டு', 2], ['நான்', 4], ['நாலு', 4], ['ந்து', 5],
  ['ஆறு', 6], ['ாறு', 6], ['ஏழு', 7], ['ேழு', 7], ['ட்டு', 8],
]

function tamilWordToNumber(word: string): number | undefined {
  for (const [stem, n] of TA_TEENS) if (word.includes(stem)) return n
  for (const [stem, n] of TA_TENS) {
    const i = word.indexOf(stem)
    if (i >= 0) {
      const rest = word.slice(i + stem.length)
      for (const [u, m] of TA_UNITS) if (rest.includes(u)) return n + m
      return n
    }
  }
  if (word.includes('நூறு') || word.includes('நூற்று')) return 100
  if (word.startsWith('பத்து')) return 10
  for (const [u, m] of TA_UNITS) if (word.includes(u)) return m
  return undefined
}

function tamilWordsToNumber(text: string): number | undefined {
  for (const w of text.split(/\s+/)) {
    const n = tamilWordToNumber(w)
    if (n !== undefined) return n
  }
  return undefined
}

/** First whole number in the answer, from digits, English words or Tamil words. */
// Words phones often hear instead of a spoken number. Only trusted for very short answers,
// so "farming for 20 years" still reads as 20.
const SOUND_ALIKE_NUMBERS: Record<string, number> = { for: 4, fore: 4, to: 2, too: 2, tree: 3, won: 1, ate: 8 }

export function parseNumber(text: string): number | undefined {
  const digits = text.replace(/,/g, '').match(/\d+(\.\d+)?/)
  if (digits) return parseFloat(digits[0])
  const n = englishWordsToNumber(text) ?? tamilWordsToNumber(text)
  if (n !== undefined) return n
  const words = clean(text).split(' ')
  if (words.length <= 3) for (const w of words) if (w in SOUND_ALIKE_NUMBERS) return SOUND_ALIKE_NUMBERS[w]
  return undefined
}

export function parseAge(text: string): Parsed<number> {
  const n = parseNumber(text)
  if (n === undefined) return fail('Say your age as a number, like "45".', 'வயதை எண்ணாகச் சொல்லுங்கள், எ.கா. "45".')
  if (!Number.isInteger(n) || n < 1 || n > 120) return fail('That age looks wrong. Please say it again.', 'அந்த வயது சரியாகத் தெரியவில்லை. மீண்டும் சொல்லுங்கள்.')
  return { ok: true, value: n }
}

export function parseFamilySize(text: string): Parsed<number> {
  const n = parseNumber(text)
  if (n === undefined) return fail('Say the number of people, like "4".', 'எத்தனை பேர் என்று எண்ணாகச் சொல்லுங்கள், எ.கா. "4".')
  if (!Number.isInteger(n) || n < 1 || n > 30) return fail('That number looks wrong. Please say it again.', 'அந்த எண் சரியாகத் தெரியவில்லை. மீண்டும் சொல்லுங்கள்.')
  return { ok: true, value: n }
}

const TA_HALF: [string, number][] = [['ஒன்றரை', 1.5], ['இரண்டரை', 2.5], ['மூன்றரை', 3.5], ['நான்கரை', 4.5]]

export function parseIncome(text: string): Parsed<number> {
  const t = clean(text)
  if (/\b(no income|nothing|zero)\b|வருமானம் இல்லை/.test(t)) return { ok: true, value: 0 }
  const monthly = /month|மாத/.test(t)
  let mult = 1
  if (/lakh|lac|லட்ச/.test(t)) mult = 100000
  else if (/thousand|ஆயிர|ாயிர/.test(t)) mult = 1000

  let n: number | undefined
  for (const [w, v] of TA_HALF) if (t.includes(w)) n = v
  if (n === undefined) {
    const digits = t.replace(/,/g, '').match(/\d+(\.\d+)?/)
    if (digits) n = parseFloat(digits[0])
  }
  if (n === undefined) {
    // "two lakh" — the multiplier words are already counted above, so strip them first
    const words = t.replace(/lakhs?|lac|thousand/g, ' ')
    n = englishWordsToNumber(words) ?? tamilWordsToNumber(t)
    if (n === undefined && mult > 1) n = 1 // "a lakh", "லட்சம்"
  }
  if (n === undefined) return fail('Say the amount, like "2 lakh" or "15,000 a month".', 'தொகையைச் சொல்லுங்கள், எ.கா. "இரண்டு லட்சம்" அல்லது "மாதம் 15,000".')

  let value = n * mult * (monthly ? 12 : 1)
  if (value > 0 && value < 1000) {
    return fail('Say the full amount, like "2 lakh" or "50,000".', 'முழுத் தொகையைச் சொல்லுங்கள், எ.கா. "இரண்டு லட்சம்" அல்லது "50,000".')
  }
  value = Math.round(value)
  if (value > 100_000_000) return fail('That amount looks too large. Please say it again.', 'அந்தத் தொகை மிக அதிகமாகத் தெரிகிறது. மீண்டும் சொல்லுங்கள்.')
  return { ok: true, value }
}

// ---------- words & choices ----------

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0]
    dp[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j]
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))
      prev = tmp
    }
  }
  return dp[b.length]
}

export function parseDistrict(text: string): Parsed<string> {
  const t = clean(text).replace(/district|மாவட்டம்|மாவட்டத்தில்|jilla/g, ' ').trim()
  let best: { en: string; len: number } | undefined
  for (const d of DISTRICTS) {
    for (const c of [d.en.toLowerCase(), d.ta, ...d.aliases]) {
      if (t.includes(c) && (!best || c.length > best.len)) best = { en: d.en, len: c.length }
    }
  }
  if (best) return { ok: true, value: best.en }

  // Close misspellings from the recognizer, e.g. "madhurai", "coimbatur"
  const words = t.split(' ').filter((w) => /^[a-z]{4,}$/.test(w))
  let near: { en: string; dist: number } | undefined
  for (const d of DISTRICTS) {
    for (const c of [d.en.toLowerCase(), ...d.aliases.filter((a) => /^[a-z ]+$/.test(a))]) {
      for (const w of words) {
        const dist = levenshtein(w, c)
        const limit = c.length >= 8 ? 3 : 2
        if (dist <= limit && (!near || dist < near.dist)) near = { en: d.en, dist }
      }
    }
  }
  if (near) return { ok: true, value: near.en }
  return fail("I couldn't find that district in Tamil Nadu. Please say it again.", 'அந்த மாவட்டம் தமிழ்நாட்டில் இல்லை. மீண்டும் சொல்லுங்கள்.')
}

export function parseGender(text: string): Parsed<Gender> {
  const t = clean(text)
  // Includes what phones often hear instead: "email" / "fe mail" for female, "mail" for male,
  // and spoken Tamil forms (பொம்பள, ஆம்பள, ஆன்).
  if (/\b(female|fe ?mail|email|woman|women|girl|lady|ladies)\b|பெண்|பொம்பள/.test(t)) return { ok: true, value: 'female' }
  if (/\b(male|mail|mails|man|men|boy|gents?)\b|ஆண்|ஆம்பள|(^|\s)ஆன்(\s|$)/.test(t)) return { ok: true, value: 'male' }
  if (/other|transgender|திருநங்கை|மூன்றாம்|மற்ற/.test(t)) return { ok: true, value: 'other' }
  return fail('Say "male", "female" or "other".', '"ஆண்", "பெண்" அல்லது "மற்றவை" என்று சொல்லுங்கள்.')
}

// Order matters: "no job" must win over "job", and "தொழிலாளி" over "தொழில்".
const OCCUPATION_WORDS: [Occupation, RegExp][] = [
  ['unemployed', /unemployed|no job|jobless|looking for (a )?(job|work)|வேலை இல்லை|வேலையில்லை|வேலை தேடு/],
  ['retired', /retired|pension|ஓய்வு/],
  ['student', /student|studying|college|school|படிக்கிற|படிக்கிறேன்|மாணவ|படிப்பு/],
  ['farmer', /farm|agricultur|cultivat|விவசா|உழவ/],
  ['daily_wage', /daily|wage|coolie|labou?r|construction|கூலி|தொழிலாளி/],
  ['homemaker', /house ?wife|home ?maker|இல்லத்தரசி|வீட்டில்/],
  ['business', /business|shop|self.?employed|own work|vendor|tailor|driver|சுயதொழில்|தொழில்|கடை|வியாபார/],
  ['salaried', /salar|job|office|company|employee|teacher|சம்பள|அலுவலக|கம்பெனி|அரசு வேலை/],
]

export function parseOccupation(text: string): Parsed<Occupation> {
  const t = clean(text)
  for (const [occ, re] of OCCUPATION_WORDS) if (re.test(t)) return { ok: true, value: occ }
  return fail('Say your work, like "farmer", "student" or "daily-wage worker".', 'உங்கள் வேலையைச் சொல்லுங்கள், எ.கா. "விவசாயி", "மாணவர்" அல்லது "கூலித் தொழிலாளி".')
}

export function parseYesNo(text: string): Parsed<boolean> {
  const t = clean(text)
  if (/\b(no|nope|not|dont|don't|nahi|none|never)\b|இல்லை|இல்ல|கிடையாது/.test(t)) return { ok: true, value: false }
  if (/\b(yes|yeah|yep|haan|sure|correct|have|has|own|owns)\b|ஆம்|ஆமா|உண்டு|இருக்கு|இருக்கிறது|உள்ளது/.test(t)) return { ok: true, value: true }
  return fail('Say "yes" or "no".', '"ஆம்" அல்லது "இல்லை" என்று சொல்லுங்கள்.')
}

export function parseName(text: string): Parsed<string> {
  let t = text.trim().replace(/[.,!?]+$/g, '')
  t = t.replace(/^(my name is|name is|i am|i'm|this is|it's|its|her name is|his name is|their name is)\s+/i, '')
  t = t.replace(/^(என் பெயர்|என்னுடைய பெயர்|என் பேர்|என் பேரு|அவர் பெயர்|அவங்க பேரு|பெயர்)\s*/, '')
  t = t.replace(/\s*(ஆகும்|தான்)$/, '').trim()
  if (t.length < 2 || t.length > 40 || /\d/.test(t) || !/[a-zA-Z஀-௿]/.test(t)) {
    return fail('Please say just the name.', 'பெயரை மட்டும் சொல்லுங்கள்.')
  }
  // Title-case English names; Tamil script has no case
  t = t.replace(/\b([a-z])([a-z]*)/g, (_, a: string, b: string) => a.toUpperCase() + b)
  return { ok: true, value: t }
}

const EN_DIGIT_WORDS: Record<string, string> = {
  zero: '0', oh: '0', one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9',
}

/** Digits read out one by one ("nine eight four…") or as a number. */
export function spokenDigits(text: string): string {
  const words = clean(text).split(' ').map((w) => EN_DIGIT_WORDS[w] ?? w)
  return words.join('').replace(/\D/g, '')
}

export function parseMobile(text: string): Parsed<string> {
  const d = spokenDigits(text).replace(/^(91|0)(?=\d{10}$)/, '')
  if (!/^[6-9]\d{9}$/.test(d)) return fail('Say the 10-digit mobile number.', '10 இலக்க மொபைல் எண்ணைச் சொல்லுங்கள்.')
  return { ok: true, value: d }
}

export function parsePincode(text: string): Parsed<string> {
  const d = spokenDigits(text)
  if (!/^[1-9]\d{5}$/.test(d)) return fail('Say the 6-digit pincode.', '6 இலக்க அஞ்சல் குறியீட்டைச் சொல்லுங்கள்.')
  return { ok: true, value: d.slice(0, 3) + ' ' + d.slice(3) }
}

export function parseFreeText(text: string): Parsed<string> {
  const t = text.trim().replace(/[.]+$/, '')
  if (t.length < 2) return fail('Please say it again.', 'மீண்டும் சொல்லுங்கள்.')
  return { ok: true, value: t.replace(/\b([a-z])([a-z]*)/g, (_, a: string, b: string) => a.toUpperCase() + b) }
}
