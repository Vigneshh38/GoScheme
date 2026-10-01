import type { FactKey, Lang, Text } from '../types'
import { say, tr } from '../lang'
import { GENDERS, OCCUPATIONS } from '../i18n'
import {
  parseAge, parseDistrict, parseFamilySize, parseGender, parseIncome, parseName, parseOccupation, parseYesNo,
  type Parsed,
} from '../lib/parse'

/** How the backup (tap / type) input looks after two failed voice tries. */
export type InputKind = 'text' | 'number' | 'choice' | 'income' | 'district' | 'yesno'

export type QuestionKey = 'name' | FactKey

export type Question = {
  key: QuestionKey
  /** Question text. `self` = asking the phone owner; otherwise about family member `name`. */
  ask: (lang: Lang, ctx: { self: boolean; name: string }) => string
  /** The spoken version, without names, so it can be pre-recorded in a natural voice. */
  say: (lang: Lang, self: boolean) => string
  hint: Text
  input: InputKind
  choices?: { value: string; label: Text }[]
  parse: (text: string) => Parsed<unknown>
}

// Hindi / Telugu / Kannada come from the dictionaries in src/lang, keyed by the English text.
const t = (lang: Lang, en: string, ta: string, name?: string) => say(lang, en, ta, name === undefined ? undefined : { name })

export const QUESTIONS: Record<QuestionKey, Question> = {
  name: {
    key: 'name',
    say: (l, self) => (self ? t(l, 'What is your name?', 'உங்கள் பெயர் என்ன?') : t(l, 'What is their name?', 'அவருடைய பெயர் என்ன?')),
    ask: (l, c) => (c.self ? t(l, 'What is your name?', 'உங்கள் பெயர் என்ன?') : t(l, 'What is their name?', 'அவருடைய பெயர் என்ன?')),
    hint: { en: 'e.g. "Murugan"', ta: 'எ.கா. "முருகன்"' },
    input: 'text',
    parse: parseName,
  },
  age: {
    key: 'age',
    say: (l, self) => (self ? t(l, 'How old are you?', 'உங்கள் வயது என்ன?') : t(l, 'How old are they?', 'அவருடைய வயது என்ன?')),
    ask: (l, c) => (c.self ? t(l, 'How old are you?', 'உங்கள் வயது என்ன?') : t(l, 'How old is {name}?', '{name} அவர்களின் வயது என்ன?', c.name)),
    hint: { en: 'e.g. "45"', ta: 'எ.கா. "45"' },
    input: 'number',
    parse: parseAge,
  },
  gender: {
    key: 'gender',
    say: (l, self) => (self ? t(l, 'Are you male, female or other?', 'நீங்கள் ஆணா, பெண்ணா, அல்லது மற்றவரா?') : t(l, 'Are they male, female or other?', 'அவர் ஆணா, பெண்ணா, அல்லது மற்றவரா?')),
    ask: (l, c) =>
      c.self
        ? t(l, 'Are you male, female or other?', 'நீங்கள் ஆணா, பெண்ணா, அல்லது மற்றவரா?')
        : t(l, 'Is {name} male, female or other?', '{name} ஆணா, பெண்ணா, அல்லது மற்றவரா?', c.name),
    hint: { en: '"Male", "Female" or "Other"', ta: '"ஆண்", "பெண்" அல்லது "மற்றவை"' },
    input: 'choice',
    choices: Object.entries(GENDERS).map(([value, label]) => ({ value, label })),
    parse: parseGender,
  },
  occupation: {
    key: 'occupation',
    say: (l, self) => (self ? t(l, 'What work do you do?', 'நீங்கள் என்ன வேலை செய்கிறீர்கள்?') : t(l, 'What work do they do?', 'அவர் என்ன வேலை செய்கிறார்?')),
    ask: (l, c) => (c.self ? t(l, 'What work do you do?', 'நீங்கள் என்ன வேலை செய்கிறீர்கள்?') : t(l, 'What does {name} do?', '{name} என்ன செய்கிறார்?', c.name)),
    hint: { en: 'e.g. "I am a farmer"', ta: 'எ.கா. "நான் விவசாயி"' },
    input: 'choice',
    choices: Object.entries(OCCUPATIONS).map(([value, label]) => ({ value, label })),
    parse: parseOccupation,
  },
  income: {
    key: 'income',
    say: (l) => t(l, "What is your family's total income in a year?", 'உங்கள் குடும்பத்தின் மொத்த ஆண்டு வருமானம் எவ்வளவு?'),
    ask: (l) => t(l, "What is your family's total income in a year?", 'உங்கள் குடும்பத்தின் மொத்த ஆண்டு வருமானம் எவ்வளவு?'),
    hint: { en: 'e.g. "2 lakh" or "15,000 a month"', ta: 'எ.கா. "இரண்டு லட்சம்" அல்லது "மாதம் 15,000"' },
    input: 'income',
    // Band edges match the scheme income limits (1, 1.2, 2, 2.5 and 3 lakh), so every
    // amount inside a band gets the same result as the value stored for it.
    choices: [
      { value: '80000', label: { en: 'Under ₹1 lakh', ta: '₹1 லட்சத்துக்குக் கீழ்' } },
      { value: '110000', label: { en: '₹1 – 1.2 lakh', ta: '₹1 – 1.2 லட்சம்' } },
      { value: '160000', label: { en: '₹1.2 – 2 lakh', ta: '₹1.2 – 2 லட்சம்' } },
      { value: '230000', label: { en: '₹2 – 2.5 lakh', ta: '₹2 – 2.5 லட்சம்' } },
      { value: '280000', label: { en: '₹2.5 – 3 lakh', ta: '₹2.5 – 3 லட்சம்' } },
      { value: '450000', label: { en: 'Above ₹3 lakh', ta: '₹3 லட்சத்துக்கு மேல்' } },
    ],
    parse: parseIncome,
  },
  district: {
    key: 'district',
    say: (l) => t(l, 'Which district do you live in?', 'நீங்கள் எந்த மாவட்டத்தில் வசிக்கிறீர்கள்?'),
    ask: (l) => t(l, 'Which district do you live in?', 'நீங்கள் எந்த மாவட்டத்தில் வசிக்கிறீர்கள்?'),
    hint: { en: 'e.g. "Madurai"', ta: 'எ.கா. "மதுரை"' },
    input: 'district',
    parse: parseDistrict,
  },
  familySize: {
    key: 'familySize',
    say: (l) => t(l, 'How many people are in your family?', 'உங்கள் குடும்பத்தில் எத்தனை பேர் உள்ளனர்?'),
    ask: (l) => t(l, 'How many people are in your family?', 'உங்கள் குடும்பத்தில் எத்தனை பேர் உள்ளனர்?'),
    hint: { en: 'e.g. "4"', ta: 'எ.கா. "4"' },
    input: 'number',
    parse: parseFamilySize,
  },

  // Asked later, only when a scheme needs the answer ("Maybe — answer 1 question").
  ownsLand: yesNo('ownsLand',
    (s, n) => (s ? 'Do you own farm land in your name?' : `Does ${n} own farm land in their name?`),
    (s, n) => (s ? 'உங்கள் பெயரில் விவசாய நிலம் உள்ளதா?' : `${n} பெயரில் விவசாய நிலம் உள்ளதா?`)),
  studiedGovtSchool: yesNo('studiedGovtSchool',
    (s, n) => (s ? 'Did you study class 6 to 12 in a government or government-aided school?' : `Did ${n} study class 6 to 12 in a government or government-aided school?`),
    (s, n) => (s ? 'நீங்கள் 6 முதல் 12 ஆம் வகுப்பு வரை அரசு அல்லது அரசு உதவி பெறும் பள்ளியில் படித்தீர்களா?' : `${n} 6 முதல் 12 ஆம் வகுப்பு வரை அரசு அல்லது அரசு உதவி பெறும் பள்ளியில் படித்தாரா?`)),
  isHeadOfFamily: yesNo('isHeadOfFamily',
    (s, n) => (s ? 'On the ration card, are you the head of the family, or the wife of the head?' : `On the ration card, is ${n} the head of the family, or the wife of the head?`),
    (s, n) => (s ? 'குடும்ப அட்டையில் நீங்கள் குடும்பத் தலைவரா, அல்லது தலைவரின் மனைவியா?' : `குடும்ப அட்டையில் ${n} குடும்பத் தலைவரா, அல்லது தலைவரின் மனைவியா?`)),
  hasBankAccount: yesNo('hasBankAccount',
    (s, n) => (s ? 'Do you have a bank account?' : `Does ${n} have a bank account?`),
    (s, n) => (s ? 'உங்களுக்கு வங்கிக் கணக்கு உள்ளதா?' : `${n} பெயரில் வங்கிக் கணக்கு உள்ளதா?`)),
  ownsPuccaHouse: yesNo('ownsPuccaHouse',
    () => 'Does your family own a pucca (concrete) house?',
    () => 'உங்கள் குடும்பத்திற்குச் சொந்தமாக கான்கிரீட் வீடு உள்ளதா?'),
  hasLpg: yesNo('hasLpg',
    () => 'Does your home have an LPG gas connection?',
    () => 'உங்கள் வீட்டில் எல்பிஜி சமையல் எரிவாயு இணைப்பு உள்ளதா?'),
}

function yesNo(key: QuestionKey, en: (self: boolean, name: string) => string, ta: (self: boolean, name: string) => string): Question {
  return {
    key,
    ask: (l, c) => say(l, en(c.self, '{name}'), ta(c.self, '{name}'), { name: c.name }),
    say: (l, self) => (l === 'ta' ? ta(self, 'அவர்') : tr(l, en(self, 'they').replace(/^Does they /, 'Do they ').replace(/^Is they /, 'Are they ').replace(/, is they /, ', are they '))),
    hint: { en: '"Yes" or "No"', ta: '"ஆம்" அல்லது "இல்லை"' },
    input: 'yesno',
    parse: parseYesNo,
  }
}

/** Onboarding for the phone owner: person + household. */
export const OWNER_FLOW: QuestionKey[] = ['name', 'age', 'gender', 'occupation', 'income', 'district', 'familySize']
/** Adding a family member: household answers are already known. */
export const MEMBER_FLOW: QuestionKey[] = ['name', 'age', 'gender', 'occupation']

export const HOUSEHOLD_KEYS: QuestionKey[] = ['income', 'district', 'familySize', 'ownsPuccaHouse', 'hasLpg']
