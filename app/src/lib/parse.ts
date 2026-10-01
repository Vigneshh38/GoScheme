/**
 * Turns spoken (or typed) answers into clean values. Chrome's speech recognizer usually
 * returns digits ("45"), but people also say numbers as words in Tamil or English, give
 * income as "2 lakh" or "15,000 a month", and name districts by nickname ("Trichy").
 */
import type { Gender, Occupation, Text } from '../types'
import { DISTRICTS } from '../data/districts'

export type Parsed<T> = { ok: true; value: T } | { ok: false; error: Text }

const fail = (en: string, ta: string): { ok: false; error: Text } => ({ ok: false, error: { en, ta } })

/**
 * The Tamil recognizer writes English words in Tamil letters: "naan student-aa irukken"
 * comes back as "நான் ஸ்டூடன்ட்டா இருக்கேன்". Each word that starts like one of these is
 * swapped for the English word, so the rules below only need to know one spelling.
 */
const LOANWORDS: [RegExp, string][] = [
  // work
  [/^ஸ்ட[ுூ][டட]/, 'student'], [/^கா[லள][ேெ]ஜ/, 'college'], [/^ஸ்கூ[லள]/, 'school'],
  [/^(ஃப|ப)ார்ம[ரி]/, 'farmer'], [/^அக்ரி/, 'agriculture'],
  [/^லேப[ரர்]/, 'labour'], [/^டெய்லி/, 'daily'], [/^கன்ஸ்ட்ர/, 'construction'], [/^மேசன்/, 'mason'],
  [/^ஹ(வு|ௌ)ஸ்/, 'house'], [/^வை(ஃப|ப)்?/, 'wife'], [/^ஹோம்/, 'home'],
  [/^பி[ஸச][ிு]?ன[ஸெ]|^பிஸ்ன/, 'business'], [/^ஷாப்/, 'shop'], [/^(டி|ட்)ரைவ/, 'driver'], [/^ஆட்டோ/, 'driver'],
  [/^டெய்லர/, 'tailor'], [/^அன்எம்ப்ள/, 'unemployed'], [/^எம்ப்ளா/, 'employee'],
  [/^ஜாப்/, 'job'], [/^ஆ(ஃப|ப)ீ?ி?ஸ/, 'office'], [/^கம்ப(ெ|ே)?னி/, 'company'], [/^(சா|ஸா|சே)லரி/, 'salary'],
  [/^டீச்சர/, 'teacher'], [/^(சா|ஸா)(ஃப|ப)்ட்/, 'software'], [/^(க|கு)வர்(ன்)?மெ?[ணன்]ட்/, 'government'],
  [/^ரி(ட்)?டை?யர|^ரிட்டயர/, 'retired'], [/^பென்(ஷ|ச)ன/, 'pension'],
  // gender
  [/^(ஃப|ப)[ீி]மே?ெ?(ல|யில)/, 'female'], [/^(மேல்|மேல|மெயில்)$/, 'male'], [/^லேடி/, 'lady'], [/^ஜென்ட்ஸ/, 'gents'],
  // yes / no
  [/^(எஸ்|யெஸ்|ஓகே|ஓக்கே)$/, 'yes'], [/^நோ$/, 'no'],
  // money
  [/^(லாக்|லேக்)/, 'lakh'], [/^(த|தொ)(வு|ௌ)ச/, 'thousand'], [/^ம(ந்|ன்)த்/, 'month'],
  // numbers said in English
  [/^ஒன்$/, 'one'], [/^டூ$/, 'two'], [/^த்ரீ$/, 'three'], [/^(ஃபோர்|போர்)$/, 'four'], [/^(ஃபைவ்|பைவ்)$/, 'five'],
  [/^சிக்ஸ்$/, 'six'], [/^செவன்$/, 'seven'], [/^எய்ட்$/, 'eight'], [/^நைன்$/, 'nine'], [/^டென்$/, 'ten'],
  [/^ட்வெ[ன்ண]்?டி/, 'twenty'], [/^தர்ட்டி|^தேர்ட்டி/, 'thirty'], [/^(ஃபி|பி)(ஃப்|ப்)டி/, 'fifty'], [/^சிக்ஸ்டி/, 'sixty'],
]

function loanwords(text: string): string {
  return text
    .split(' ')
    .map((w) => {
      for (const [re, en] of LOANWORDS) if (re.test(w)) return en
      return w
    })
    .join(' ')
}

/** Tamil, Devanagari, Telugu and Kannada digits → 0-9 (recognizers sometimes return them). */
function asciiDigits(text: string): string {
  return text.replace(/[\u0BE6-\u0BEF\u0966-\u096F\u0C66-\u0C6F\u0CE6-\u0CEF]/g, (c) => String((c.charCodeAt(0) - 6) & 0xf))
}

function clean(text: string): string {
  return loanwords(
    asciiDigits(text)
      .toLowerCase()
      .replace(/(\d),(?=\d)/g, '$1') // 15,000 → 15000
      .replace(/[,!?।]/g, ' ')
      .replace(/\.(?!\d)/g, ' ') // drop full stops but keep decimals like 2.5
      .replace(/\s+/g, ' ')
      .trim(),
  )
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

// Tamil number words, written and spoken forms. A word must *start* with one of these, so
// ordinary words are never read as numbers (நான் "I" is not நான்கு "4", வந்து is not ஐந்து).
// Joined forms keep their start: இருபத்தைந்து, அம்பதாயிரம், ரெண்டாயிரம்.
const TA_TEENS: [RegExp, number][] = [
  [/^(பத்தொ|பத்தொம்)/, 19], [/^பதினெ/, 18], [/^பதினே/, 17], [/^பதினாறு|^பதினாற/, 16], [/^(பதினை|பதினஞ்)/, 15],
  [/^பதினா/, 14], [/^பதிமூ/, 13], [/^(பன்னிர|பன்னெ|பனிர)/, 12], [/^பதினொ/, 11],
]
const TA_TENS: [RegExp, number][] = [
  [/^தொண்ணூ/, 90], [/^(எண்ப|எம்ப)/, 80], [/^எழுப/, 70], [/^அறுப/, 60], [/^(ஐம்ப|அம்ப|அய்ம்ப)/, 50],
  [/^(நாற்ப|நாப்ப)/, 40], [/^முப்ப/, 30], [/^இருப/, 20],
]
const TA_UNITS: [RegExp, number][] = [
  [/^(ஒன்பது|ஒம்பது|ஒன்பதா)/, 9], [/^(ஒன்று|ஒன்னு|ஒன்றா|ஒரு|ஓர்|ஓரா)/, 1], [/^(இரண்|ரெண்|இரெண்)/, 2],
  [/^(மூன்|மூணு|மூணா|மூவா)/, 3], [/^(நான்கு|நான்கா|நாலு|நாலா)/, 4], [/^(ஐந்|அஞ்சு|அஞ்சா|ஐயாயிர)/, 5],
  [/^(ஆறு|ஆறா)/, 6], [/^(ஏழு|ஏழா)/, 7], [/^(எட்டு|எட்டா)/, 8], [/^(பத்து|பத்தா)/, 10],
]
// The unit left over after a tens word: இருபத்(தி)ஒன்று, நாப்பத்தஞ்சு, முப்பத்திரெண்டு
const TA_JOINED_UNITS: [RegExp, number][] = [
  [/ொன்பது|ஒன்பது|ொம்பது/, 9], [/ொன்று|ொன்னு|ஒன்னு|ஒன்று|ொரு|ஒரு/, 1], [/ரண்டு|ரெண்டு/, 2],
  [/மூன்று|மூணு/, 3], [/நான்கு|நாலு/, 4], [/ைந்து|ஐந்து|அஞ்சு|ஞ்சு/, 5], [/ாறு|ஆறு/, 6], [/ேழு|ஏழு/, 7],
  [/ெட்டு|எட்டு/, 8],
]

type NumTable = { teens: [RegExp, number][]; tens: [RegExp, number][]; units: [RegExp, number][]; joined: [RegExp, number][]; hundred: RegExp }

const TA_NUM: NumTable = { teens: TA_TEENS, tens: TA_TENS, units: TA_UNITS, joined: TA_JOINED_UNITS, hundred: /^(நூறு|நூற்று|நூத்)/ }

// Telugu joins tens and units without changing them: ఇరవై ఒకటి / ఇరవైఒకటి = 21.
const TE_UNITS: [RegExp, number][] = [
  [/^తొమ్మిది/, 9], [/^ఎనిమిది/, 8], [/^ఏడు/, 7], [/^ఆరు/, 6], [/^(ఐదు|అయిదు)/, 5], [/^నాలుగ/, 4], [/^మూడు/, 3],
  [/^రెండు/, 2], [/^(ఒకటి|ఒక్క|ఒక)/, 1], [/^పది/, 10],
]
const TE_NUM: NumTable = {
  teens: [[/^పదకొండు/, 11], [/^పన్నెండు/, 12], [/^పదమూడు/, 13], [/^పద్నాలుగు/, 14], [/^పదిహేన/, 15], [/^(పదహారు|పదారు)/, 16],
    [/^పదిహేడు/, 17], [/^(పద్దెనిమిది|పద్ధెనిమిది)/, 18], [/^పందొమ్మిది/, 19]],
  tens: [[/^(తొంభై|తొంబై)/, 90], [/^(ఎనభై|ఎనబై)/, 80], [/^డెబ్బై/, 70], [/^అరవై/, 60], [/^(యాభై|యాబై)/, 50], [/^(నలభై|నలబై)/, 40],
    [/^(ముప్పై|ముప్ఫై)/, 30], [/^ఇరవై/, 20]],
  units: TE_UNITS, joined: TE_UNITS, hundred: /^(వంద|నూరు)/,
}

// Kannada tens end in ತ್ತ before a joined unit: ಇಪ್ಪತ್ತೊಂದು = 21, ಇಪ್ಪತ್ತು = 20.
const KN_NUM: NumTable = {
  teens: [[/^ಹನ್ನೊಂದು/, 11], [/^ಹನ್ನೆರಡು/, 12], [/^ಹದಿಮೂರು/, 13], [/^ಹದಿನಾಲ್ಕು/, 14], [/^ಹದಿನೈದು/, 15], [/^ಹದಿನಾರು/, 16],
    [/^ಹದಿನೇಳು/, 17], [/^ಹದಿನೆಂಟು/, 18], [/^ಹತ್ತೊಂಬತ್ತು/, 19]],
  tens: [[/^ತೊಂಬತ್ತ/, 90], [/^ಎಂಬತ್ತ/, 80], [/^ಎಪ್ಪತ್ತ/, 70], [/^ಅರವತ್ತ/, 60], [/^ಐವತ್ತ/, 50], [/^(ನಲವತ್ತ|ನಲ್ವತ್ತ)/, 40],
    [/^ಮೂವತ್ತ/, 30], [/^ಇಪ್ಪತ್ತ/, 20]],
  units: [[/^ಒಂಬತ್ತು/, 9], [/^ಎಂಟು/, 8], [/^ಏಳು/, 7], [/^ಆರು/, 6], [/^ಐದು/, 5], [/^ನಾಲ್ಕು/, 4], [/^ಮೂರು/, 3], [/^ಎರಡು/, 2],
    [/^ಒಂದ/, 1], [/^ಹತ್ತು/, 10]],
  joined: [[/^ೊಂಬತ್ತು/, 9], [/^ೆಂಟು/, 8], [/^ೇಳು/, 7], [/^ಾರು/, 6], [/^ೈದು/, 5], [/^ನಾಲ್ಕು/, 4], [/^ಮೂರು/, 3], [/^ೆರಡು/, 2], [/^ೊಂದು/, 1]],
  hundred: /^ನೂರ/,
}

// Hindi has its own word for every number up to 100 (spelling variants after "|").
const HI_NUM: Record<string, number> = Object.fromEntries(
  ('एक दो तीन चार पांच|पाँच छह|छः|छे सात आठ नौ दस ग्यारह बारह तेरह चौदह पंद्रह|पन्द्रह सोलह सत्रह अठारह उन्नीस बीस ' +
   'इक्कीस बाईस तेईस चौबीस पच्चीस छब्बीस सत्ताईस अट्ठाईस|अठाईस उनतीस तीस इकतीस|इकत्तीस बत्तीस तैंतीस चौंतीस पैंतीस छत्तीस ' +
   'सैंतीस अड़तीस|अडतीस उनतालीस चालीस इकतालीस बयालीस तैंतालीस चवालीस|चौवालीस पैंतालीस छियालीस सैंतालीस अड़तालीस|अडतालीस ' +
   'उनचास पचास इक्यावन बावन तिरपन चौवन पचपन छप्पन सत्तावन अट्ठावन उनसठ साठ इकसठ बासठ तिरसठ चौंसठ पैंसठ छियासठ ' +
   'सड़सठ|सडसठ अड़सठ|अडसठ उनहत्तर सत्तर इकहत्तर बहत्तर तिहत्तर चौहत्तर पचहत्तर छिहत्तर सतहत्तर अठहत्तर उन्यासी|उनासी अस्सी ' +
   'इक्यासी बयासी तिरासी चौरासी पचासी छियासी सत्तासी अट्ठासी नवासी नब्बे इक्यानवे बानवे तिरानवे चौरानवे पचानवे ' +
   'छियानवे सत्तानवे अट्ठानवे निन्यानवे सौ')
    .split(' ').flatMap((forms, i) => forms.split('|').map((f) => [f, i + 1])),
)

// Counting people ("four of us"): Telugu and Kannada have their own words.
const PEOPLE: [RegExp, number][] = [
  [/^ఇద్దరు/, 2], [/^ముగ్గురు/, 3], [/^నలుగురు/, 4], [/^ಇಬ್ಬರು/, 2], [/^ಮೂವರು/, 3], [/^ನಾಲ್ವರು/, 4], [/^ಐವರು/, 5],
  [/^இருவர்/, 2], [/^மூவர்/, 3], [/^நால்வர்/, 4],
]

/** `open`: a tens word with no unit yet, so the next word may add one ("இருபத்தி ஒன்னு"). */
function wordToNumber(word: string, t: NumTable): { n: number; open: boolean } | undefined {
  for (const [re, n] of t.teens) if (re.test(word)) return { n, open: false }
  for (const [re, n] of t.tens) {
    const m = word.match(re)
    if (m) {
      const rest = word.slice(m[0].length)
      for (const [u, v] of t.joined) if (u.test(rest) && v < 10) return { n: n + v, open: false }
      return { n, open: true }
    }
  }
  if (t.hundred.test(word)) return { n: 100, open: false }
  for (const [re, n] of t.units) if (re.test(word)) return { n, open: false }
  return undefined
}

/** First number said in words, in Tamil, Hindi, Telugu or Kannada. */
function tamilWordsToNumber(text: string): number | undefined {
  const words = text.split(/\s+/)
  for (let i = 0; i < words.length; i++) {
    if (words[i] in HI_NUM) return HI_NUM[words[i]]
    for (const [re, n] of PEOPLE) if (re.test(words[i])) return n
    for (const table of [TA_NUM, TE_NUM, KN_NUM]) {
      const hit = wordToNumber(words[i], table)
      if (!hit) continue
      if (hit.open && words[i + 1]) {
        const next = wordToNumber(words[i + 1], table)
        if (next && next.n < 10) return hit.n + next.n
      }
      return hit.n
    }
  }
  return undefined
}

/** First whole number in the answer, from digits, English words or Tamil words. */
// Words phones often hear instead of a spoken number. Only trusted for very short answers,
// so "farming for 20 years" still reads as 20.
const SOUND_ALIKE_NUMBERS: Record<string, number> = { for: 4, fore: 4, to: 2, too: 2, tree: 3, won: 1, ate: 8 }

export function parseNumber(text: string): number | undefined {
  text = asciiDigits(text)
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

const TA_HALF: [RegExp, number][] = [
  [/ஒன்றரை|ஒன்னரை/, 1.5], [/இரண்டரை|ரெண்டரை/, 2.5], [/மூன்றரை|மூணரை/, 3.5], [/நான்கரை|நாலரை/, 4.5],
  [/डेढ़|डेढ|ఒకటిన్నర|ಒಂದೂವರೆ/, 1.5], [/ढाई|రెండున్నర|ಎರಡೂವರೆ/, 2.5], [/మూడున్నర|ಮೂರೂವರೆ/, 3.5],
  [/(^|\s)(அரை|आधा)(\s|$)|\bhalf\b/, 0.5],
]
const LAKH = /lakhs?|lac|லட்ச|லெட்ச|लाख|లక్ష|ಲಕ್ಷ/
const THOUSAND = /thousand|ஆயிர|ாயிர|हज़ार|हजार|వేల|వేలు|వెయ్యి|ಸಾವಿರ/

export function parseIncome(text: string): Parsed<number> {
  const t = clean(text)
  if (/\b(no income|nothing|zero)\b|வருமானம் இல்ல|வருமானமே இல்ல|ஒன்னும் இல்ல|எதுவும் இல்ல|आय नहीं|आमदनी नहीं|कोई आय|ఆదాయం లేదు|ఆదాయం ఏమీ లేదు|ಆದಾಯ ಇಲ್ಲ/.test(t)) return { ok: true, value: 0 }
  const monthly = /month|மாத|மாச|महीन|माह|मासिक|నెల|ತಿಂಗಳ/.test(t)

  // "1 லட்சத்து 50 ஆயிரம்", "ஒரு லட்சத்து அம்பதாயிரம்": lakh part + thousand part
  const lakhAt = t.search(LAKH)
  if (lakhAt >= 0 && THOUSAND.test(t.slice(lakhAt))) {
    const after = t.slice(lakhAt).replace(/^\S+/, '')
    const l = parseIncome(t.slice(0, lakhAt) + ' lakh')
    const k = parseIncome(after)
    if (l.ok && k.ok) return { ok: true, value: l.value + k.value }
  }

  let mult = 1
  if (LAKH.test(t)) mult = 100000
  else if (THOUSAND.test(t)) mult = 1000

  let n: number | undefined
  for (const [re, v] of TA_HALF) if (re.test(t)) { n = v; break }
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
  const t = clean(text).replace(/district|மாவட்டம்|மாவட்டத்தில்|jilla|ज़िला|जिला|జిల్లా|ಜಿಲ್ಲೆ/g, ' ').trim()
  let best: { en: string; len: number } | undefined
  for (const d of DISTRICTS) {
    for (const c of [d.en.toLowerCase(), d.ta, d.hi, d.te, d.kn, ...d.aliases]) {
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
  if (/\b(female|fe ?mail|email|woman|women|girl|lady|ladies|ponnu|pombala|pen)\b|பெண்|பொண்ணு|பொம்பள|பொம்பிள|महिला|औरत|स्त्री|लड़की|लडकी|फीमेल|फ़ीमेल|స్త్రీ|మహిళ|అమ్మాయి|ఆడ|ఫీమేల్|ಮಹಿಳೆ|ಹೆಣ್ಣು|ಸ್ತ್ರೀ|ಹುಡುಗಿ|ಫೀಮೇಲ್/.test(t)) return { ok: true, value: 'female' }
  if (/\b(male|mail|mails|man|men|boy|gents?|paiyan|aambala|ambala|aan)\b|ஆண்|ஆம்பள|ஆம்பிள|பையன்|(^|\s)ஆன்(\s|$)|पुरुष|पुरूष|आदमी|मर्द|लड़का|लडका|मेल|పురుష|మగ|అబ్బాయి|మేల్|ಪುರುಷ|ಗಂಡು|ಹುಡುಗ|ಮೇಲ್/.test(t)) return { ok: true, value: 'male' }
  if (/other|transgender|திருநங்கை|மூன்றாம்|மற்ற|अन्य|ट्रांसजेंडर|किन्नर|ఇతర|ట్రాన్స్|ಇತರ|ಮಂಗಳಮುಖಿ|ಟ್ರಾನ್ಸ್/.test(t)) return { ok: true, value: 'other' }
  return fail('Say "male", "female" or "other".', '"ஆண்", "பெண்" அல்லது "மற்றவை" என்று சொல்லுங்கள்.')
}

// Order matters: "no job" must win over "job", and "தொழிலாளி" over "தொழில்".
// Covers written Tamil, spoken Tamil (வேல இல்ல, படிக்குறேன்), English said in Tamil letters
// (turned into English by `clean`) and Tanglish typed in English letters (padikiren, kooli).
const OCCUPATION_WORDS: [Occupation, RegExp][] = [
  ['unemployed', /बेरोजगार|बेरोज़गार|काम नहीं|नौकरी नहीं|नौकरी ढूं|नौकरी ढूँ|काम ढूं|काम ढूँ|ఉద్యోగం లేదు|పని లేదు|నిరుద్యోగ|ఖాళీగా|ఉద్యోగం వెతు|ಕೆಲಸ ಇಲ್ಲ|ಉದ್ಯೋಗ ಇಲ್ಲ|ನಿರುದ್ಯೋಗ|ಕೆಲಸ ಹುಡುಕ|unemployed|no (job|work)|jobless|not working|looking for (a )?(job|work)|job illa|velai? illa|summa|வேலை? இல்ல|வேலையில்ல|வேலை? கிடைக்கல|வேலை? தேடு|சும்மா இருக்/],
  ['retired', /रिटायर|सेवानिवृत्त|पेंशन|రిటైర్|పదవీ విరమణ|పెన్షన్|పింఛను|ನಿವೃತ್ತ|ರಿಟೈರ್|ಪಿಂಚಣಿ|ಪೆನ್ಷನ್|retired|pension|ஓய்வு/],
  // Before "student", so "school teacher" / "college professor" are not read as students.
  ['salaried', /teacher|टीचर|शिक्षक|अध्यापक|प्रोफेसर|టీచర్|ఉపాధ్యాయ|ప్రొఫెసర్|ಟೀಚರ್|ಶಿಕ್ಷಕ|ಪ್ರಾಧ್ಯಾಪಕ|professor|lecturer|principal|ஆசிரிய|பேராசிரிய/],
  ['student', /छात्र|विद्यार्थी|पढ़ाई|पढ़ता|पढ़ती|पढ़ रह|पढाई|पढता|पढती|कॉलेज|कालेज|स्कूल|स्टूडेंट|విద్యార్థి|చదువు|కాలేజ|స్కూల్|స్టూడెంట్|ವಿದ್ಯಾರ್ಥಿ|ಓದುತ್ತ|ಓದ್ತ|ಕಾಲೇಜ|ಶಾಲೆ|ಸ್ಟೂಡೆಂಟ್|student|studying|college|school|padikk?i|padikk?u|padichu|படிக்கி|படிக்கு|படிச்சு?(ட்டு|ிட்டு|க்கிட்டு)|மாணவ|படிப்பு/],
  ['farmer', /किसान|खेती|कृषि|రైతు|వ్యవసాయ|పొలం|ರೈತ|ಕೃಷಿ|ಬೇಸಾಯ|ಗದ್ದೆ|farm|agricultur|cultivat|vivasa|vivasaa|விவசா|உழவ|வயல்|தோட்ட/],
  ['daily_wage', /मज़दूर|मजदूर|दिहाड़ी|दिहाडी|कुली|लेबर|राजमिस्त्री|కూలీ|కూలి|కార్మిక|లేబర్|మేస్త్రీ|తాపీ|ಕೂಲಿ|ಕಾರ್ಮಿಕ|ಲೇಬರ್|ಗಾರೆ|daily|wage|coolie|kooli|kuli|labou?r|construction|mason|helper|loading|cook|maid|servant|domestic|cleaner|sweeper|housekeeping|fisher|சமையல்|வீட்டு வேலை|மீனவ|மீன் பிடி|துப்புரவு|கூலி|தொழிலாளி|சித்தாள்|மேஸ்திரி|கொத்தனார்|கட்ட[டி]|லோடு|மூட்டை|நூறு நாள்|100 நாள்/],
  ['homemaker', /गृहिणी|हाउसवाइफ|हाउस वाइफ|घर पर रह|घर संभाल|గృహిణి|ఇంట్లో ఉంట|ఇంట్లోనే|హౌస్ వైఫ్|ಗೃಹಿಣಿ|ಮನೆಯಲ್ಲಿ ಇರ|ಮನೆಯಲ್ಲೇ|ಹೌಸ್ ವೈಫ್|house ?wife|home ?maker|housewife|veetla|வீட்ல(யே)? இருக்|வீட்டில(்|ே|யே)? இருக்|இல்லத்தரசி|குடும்பத் ?தலைவி/],
  ['business', /व्यापार|व्यवसाय|बिज़नेस|बिजनेस|दुकान|ड्राइवर|ऑटो|दर्जी|टेलर|स्वरोजगार|स्वरोज़गार|अपना काम|వ్యాపార|బిజినెస్|షాప్|దుకాణ|అంగడి|డ్రైవర్|ఆటో|టైలర్|దర్జీ|సొంత పని|ವ್ಯಾಪಾರ|ಬಿಸಿನೆಸ್|ಅಂಗಡಿ|ಡ್ರೈವರ್|ಆಟೋ|ಟೈಲರ್|ದರ್ಜಿ|ಸ್ವಂತ ಕೆಲಸ|ಸ್ವ ಉದ್ಯೋಗ|ಸ್ವಉದ್ಯೋಗ|business|shop|self.?employed|own work|vendor|tailor|driver|mechanic|electrician|plumber|carpenter|barber|painter|weaver|potter|kadai|vyabar|மெக்கானிக்|எலக்ட்ரீஷியன்|பிளம்பர்|தச்ச|முடி திருத்த|பார்பர்|பெயிண்டர்|நெசவ|சுயதொழில்|சொந்த ?தொழில்|தொழில்|கடை|வியாபார|தையல்/],
  ['salaried', /salar|नौकरी|जॉब|ऑफिस|ऑफ़िस|कंपनी|कर्मचारी|तनख्वाह|वेतन|सैलरी|सरकारी|डॉक्टर|नर्स|पुलिस|ఉద్యోగ|జాబ్|ఆఫీస్|కంపెనీ|జీతం|ప్రభుత్వ|డాక్టర్|నర్స్|పోలీస్|ಉದ್ಯೋಗ|ಕೆಲಸ ಮಾಡ|ಜಾಬ್|ಆಫೀಸ್|ಕಂಪನಿ|ಸಂಬಳ|ಸರ್ಕಾರಿ|ಡಾಕ್ಟರ್|ನರ್ಸ್|ಪೊಲೀಸ್|job|office|company|employee|teacher|professor|lecturer|software|engineer|government|nurse|doctor|police|clerk|accountant|bank|guard|security|watchman|டாக்டர்|மருத்துவர்|நர்ஸ்|செவிலி|போலீஸ்|காவல|இன்ஜினியர்|என்ஜினியர்|பொறியாளர்|வாட்ச்மேன்|செக்யூரிட்டி|டீச்சர்|பேராசிரிய|velai? paa?r|velaikk?u po|சம்பள|அலுவலக|ஆசிரிய|அரசு வேலை|வேலை? பா(க்|ர்)க|வேலைக்கு போ|வேலை? (செய்|பண்ண|பண்ற)/],
]

export function parseOccupation(text: string): Parsed<Occupation> {
  const t = clean(text)
  for (const [occ, re] of OCCUPATION_WORDS) if (re.test(t)) return { ok: true, value: occ }
  return fail('Say your work, like "farmer", "student" or "daily-wage worker".', 'உங்கள் வேலையைச் சொல்லுங்கள், எ.கா. "விவசாயி", "மாணவர்" அல்லது "கூலித் தொழிலாளி".')
}

export function parseYesNo(text: string): Parsed<boolean> {
  const t = clean(text)
  if (/\b(no|nope|not|dont|don't|nahi|none|never|illa|illai|ille|kidayathu|kedayathu)\b|இல்லை|இல்ல|கிடையாது|கெடயாது|வேண்டாம்|नहीं|नही|(^|\s)ना(\s|$)|లేదు|లేవు|కాదు|వద్దు|ಇಲ್ಲ|ಅಲ್ಲ|ಬೇಡ/.test(t)) return { ok: true, value: false }
  if (/\b(yes|yeah|yep|haan|sure|correct|have|has|own|owns|aama|aamaa|amam|irukku|iruku)\b|ஆம்|ஆமா|ஆமாம்|உண்டு|இருக்கு|இருக்கிறது|இருக்குது|உள்ளது|வச்சிருக்|வெச்சிருக்|हाँ|हां|(^|\s)हा(\s|$)|(^|\s)है(\s|$)|हैं|बिल्कुल|అవును|ఉంది|ఉన్నాయి|ఉన్నది|ಹೌದು|ಇದೆ|ಇವೆ|ಹೂಂ/.test(t)) return { ok: true, value: true }
  return fail('Say "yes" or "no".', '"ஆம்" அல்லது "இல்லை" என்று சொல்லுங்கள்.')
}

export function parseName(text: string): Parsed<string> {
  let t = text.trim().replace(/[.,!?]+$/g, '')
  t = t.replace(/^(my name is|name is|i am|i'm|this is|it's|its|her name is|his name is|their name is)\s+/i, '')
  t = t.replace(/^(en peru|en per|enoda peru|naan|nan|my name)\s+/i, '')
  t = t.replace(/^(என் பெயர்|என்னுடைய பெயர்|என்னோட பேரு|என்னோட பெயர்|என் பேர்|என் பேரு|அவர் பெயர்|அவங்க பேரு|அவன் பேரு|அவ பேரு|பெயர்|பேரு|மை நேம் இஸ்|நான்)\s*/, '')
  t = t.replace(/\s*(ஆகும்|தான்|ங்க|பேசுறேன்|பேசுகிறேன்|இருக்கேன்)$/, '').trim()
  t = t.replace(/^(मेरा नाम|मेरा नाम है|नाम|मैं|నా పేరు|పేరు|నేను|ನನ್ನ ಹೆಸರು|ಹೆಸರು|ನಾನು)\s+/, '')
  t = t.replace(/\s+(है|हूँ|हूं|जी|అండి|అని|ಅಂತ|ಆಗಿದೆ|ರೀ)$/, '').trim()
  if (t.length < 2 || t.length > 40 || /\d/.test(t) || !/[a-zA-Z\u0B80-\u0BFF\u0900-\u097F\u0C00-\u0C7F\u0C80-\u0CFF]/.test(t)) {
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
