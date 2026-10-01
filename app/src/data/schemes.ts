/**
 * The 10 demo schemes. Benefits come from the official scheme sites; eligibility rules are
 * simplified for the prototype (the app says so on every scheme page).
 */
import type { LucideIcon } from 'lucide-react'
import {
  GraduationCap, HandHeart, HardHat, HeartPulse, House, Flame, Landmark, ShieldCheck, Wheat, BookOpen,
} from 'lucide-react'
import type { FactKey, HouseholdFacts, Lang, Member, Occupation, Text } from '../types'
import { GENDERS, OCCUPATIONS, formatIncome } from '../i18n'
import { parseFreeText, parseMobile, parseName, parsePincode, type Parsed } from '../lib/parse'
import { districtByName } from './districts'
import { pickText } from '../lang'

export type Rule = {
  key: FactKey
  test: (v: never) => boolean
  need: Text
  fix?: Text
  /** Only check this rule when it applies (e.g. "landless" only matters for farmers). */
  when?: (m: Member, h: HouseholdFacts) => boolean
}

export type DocId = 'aadhaar' | 'bank' | 'land' | 'ration' | 'income' | 'school' | 'college' | 'age' | 'jobcard'

export const DOCS: Record<DocId, Text> = {
  aadhaar: { en: 'Aadhaar card', ta: 'ஆதார் அட்டை' },
  bank: { en: 'Bank passbook', ta: 'வங்கிக் கணக்குப் புத்தகம்' },
  land: { en: 'Land record (patta)', ta: 'நிலப் பட்டா' },
  ration: { en: 'Ration card', ta: 'குடும்ப அட்டை' },
  income: { en: 'Income certificate', ta: 'வருமானச் சான்றிதழ்' },
  school: { en: 'School certificates (class 6–12)', ta: 'பள்ளிச் சான்றிதழ்கள் (6–12)' },
  college: { en: 'College ID or bonafide certificate', ta: 'கல்லூரி அடையாள அட்டை / சான்றிதழ்' },
  age: { en: 'Age proof', ta: 'வயதுச் சான்று' },
  jobcard: { en: 'MGNREGA job card', ta: '100 நாள் வேலை அட்டை' },
}

/** Documents the app can read with the camera. */
export const SCANNABLE: DocId[] = ['aadhaar', 'bank', 'land', 'ration']

export type FieldSource = 'profile' | 'document' | 'voice'

export type FieldDef = {
  id: string
  label: Text
  source: FieldSource
  /** profile: read the value from the saved profile */
  fromProfile?: (m: Member, h: HouseholdFacts, lang: Lang) => string | undefined
  /** document: which document it is read from */
  doc?: DocId
  /** voice: how to ask for it and check the answer */
  voice?: { ask: Text; parse: (t: string) => Parsed<string>; numeric?: boolean }
  /** value used by "Use demo values" when no document is at hand */
  demo: string
}

const F = {
  name: { id: 'name', label: { en: 'Full name', ta: 'முழுப் பெயர்' }, source: 'profile', fromProfile: (m) => m.name, demo: '' },
  age: { id: 'age', label: { en: 'Age', ta: 'வயது' }, source: 'profile', fromProfile: (m) => (m.age ? String(m.age) : undefined), demo: '' },
  gender: { id: 'gender', label: { en: 'Gender', ta: 'பாலினம்' }, source: 'profile', fromProfile: (m, _h, l) => (m.gender ? pickText(GENDERS[m.gender], l) : undefined), demo: '' },
  occupation: { id: 'occupation', label: { en: 'Work', ta: 'வேலை' }, source: 'profile', fromProfile: (m, _h, l) => (m.occupation ? pickText(OCCUPATIONS[m.occupation], l) : undefined), demo: '' },
  district: { id: 'district', label: { en: 'District', ta: 'மாவட்டம்' }, source: 'profile', fromProfile: (_m, h, l) => { const d = districtByName(h.district); return d ? d[l] : undefined }, demo: '' },
  income: { id: 'income', label: { en: 'Family income (a year)', ta: 'குடும்ப ஆண்டு வருமானம்' }, source: 'profile', fromProfile: (_m, h, l) => (h.income !== undefined ? formatIncome(h.income, l) : undefined), demo: '' },
  aadhaar: { id: 'aadhaar', label: { en: 'Aadhaar number', ta: 'ஆதார் எண்' }, source: 'document', doc: 'aadhaar', demo: 'XXXX XXXX 4821' },
  bankAccount: { id: 'bankAccount', label: { en: 'Bank account', ta: 'வங்கிக் கணக்கு' }, source: 'document', doc: 'bank', demo: 'XXXXXX3390' },
  ifsc: { id: 'ifsc', label: { en: 'IFSC code', ta: 'IFSC குறியீடு' }, source: 'document', doc: 'bank', demo: 'ABCD0123456' },
  surveyNo: { id: 'surveyNo', label: { en: 'Land survey number', ta: 'நில அளவை எண்' }, source: 'document', doc: 'land', demo: '112/3' },
  rationCard: { id: 'rationCard', label: { en: 'Ration card number', ta: 'குடும்ப அட்டை எண்' }, source: 'document', doc: 'ration', demo: 'XXXXXXXX7719' },
  fatherName: { id: 'fatherName', label: { en: "Father's or husband's name", ta: 'தந்தை / கணவர் பெயர்' }, source: 'voice', voice: { ask: { en: "What is the father's or husband's name?", ta: 'தந்தை அல்லது கணவரின் பெயர் என்ன?' }, parse: parseName }, demo: 'Kannan' },
  mobile: { id: 'mobile', label: { en: 'Mobile number', ta: 'மொபைல் எண்' }, source: 'voice', voice: { ask: { en: 'What is the mobile number?', ta: 'மொபைல் எண் என்ன?' }, parse: parseMobile, numeric: true }, demo: '9876543210' },
  pincode: { id: 'pincode', label: { en: 'Pincode', ta: 'அஞ்சல் குறியீடு' }, source: 'voice', voice: { ask: { en: 'What is the pincode?', ta: 'அஞ்சல் குறியீடு என்ன?' }, parse: parsePincode, numeric: true }, demo: '625 106' },
  village: { id: 'village', label: { en: 'Village or town', ta: 'கிராமம் / ஊர்' }, source: 'voice', voice: { ask: { en: 'Which village or town?', ta: 'எந்த கிராமம் அல்லது ஊர்?' }, parse: parseFreeText }, demo: 'Melur' },
  college: { id: 'college', label: { en: 'College name', ta: 'கல்லூரியின் பெயர்' }, source: 'voice', voice: { ask: { en: 'Which college?', ta: 'எந்தக் கல்லூரி?' }, parse: parseFreeText }, demo: 'Govt Arts College, Madurai' },
  nominee: { id: 'nominee', label: { en: "Nominee's name", ta: 'நியமனதாரர் பெயர்' }, source: 'voice', voice: { ask: { en: "What is the nominee's name?", ta: 'நியமனதாரரின் பெயர் என்ன?' }, parse: parseName }, demo: 'Lakshmi' },
} satisfies Record<string, FieldDef>

export type Tone = 'green' | 'pink' | 'orange' | 'blue' | 'amber' | 'violet' | 'teal' | 'slate' | 'red' | 'indigo'

export type Scheme = {
  id: string
  name: Text
  by: Text
  benefit: Text
  /** Yearly cash value, used for the "worth ₹… a year" total. 0 for cover / one-time help. */
  cashPerYear: number
  icon: LucideIcon
  tone: Tone
  /** 'household' schemes cover the whole family and are checked once. */
  scope: 'member' | 'household'
  link: string
  rules: Rule[]
  documents: DocId[]
  fields: FieldDef[]
}

const r = {
  female: { key: 'gender', test: (v: string) => v === 'female', need: { en: 'A woman', ta: 'பெண்' },
    fix: { en: 'This scheme is for women. It may suit your wife, mother or daughter — add them to your family.', ta: 'இது பெண்களுக்கான திட்டம். உங்கள் மனைவி, தாய் அல்லது மகளுக்குப் பொருந்தலாம் — அவர்களைக் குடும்பத்தில் சேர்க்கவும்.' } },
  male: { key: 'gender', test: (v: string) => v === 'male', need: { en: 'A boy / young man', ta: 'ஆண் மாணவர்' },
    fix: { en: 'Girls can get the same support from Pudhumai Penn.', ta: 'மாணவிகளுக்கு இதே உதவி புதுமைப் பெண் திட்டத்தில் கிடைக்கும்.' } },
  student: { key: 'occupation', test: (v: Occupation) => v === 'student', need: { en: 'Studying in college, diploma or ITI', ta: 'கல்லூரி, பட்டயம் அல்லது ஐடிஐ-யில் படிப்பவர்' },
    fix: { en: 'For students who are studying after class 12.', ta: '12 ஆம் வகுப்புக்குப் பிறகு படிக்கும் மாணவர்களுக்கு.' } },
  collegeAge: { key: 'age', test: (v: number) => v >= 17 && v <= 25, need: { en: 'Age 17 to 25', ta: 'வயது 17 முதல் 25' } },
  govtSchool: { key: 'studiedGovtSchool', test: (v: boolean) => v, need: { en: 'Studied class 6–12 in a government or government-aided school', ta: '6–12 ஆம் வகுப்பு அரசு அல்லது அரசு உதவி பெறும் பள்ளியில் படித்தவர்' },
    fix: { en: 'Only for students from government or government-aided schools.', ta: 'அரசு அல்லது அரசு உதவி பெறும் பள்ளியில் படித்த மாணவர்களுக்கு மட்டும்.' } },
  income: (max: number, lakh: string): Rule => ({
    key: 'income', test: ((v: number) => v <= max) as (v: never) => boolean,
    need: { en: `Family income up to ₹${lakh} lakh a year`, ta: `குடும்ப ஆண்டு வருமானம் ₹${lakh} லட்சம் வரை` },
    fix: { en: 'If your income certificate shows less, update the family income in Family.', ta: 'வருமானச் சான்றிதழில் குறைவாக இருந்தால், "குடும்பம்" பகுதியில் வருமானத்தைப் புதுப்பிக்கவும்.' },
  }),
  bank: { key: 'hasBankAccount', test: (v: boolean) => v, need: { en: 'Has a bank account', ta: 'வங்கிக் கணக்கு உள்ளவர்' },
    fix: { en: 'Open a free Jan Dhan account at any bank, then apply.', ta: 'எந்த வங்கியிலும் இலவச ஜன் தன் கணக்கு தொடங்கி, பின் விண்ணப்பிக்கவும்.' } },
} as const

const rule = (x: Rule): Rule => x

export const SCHEMES: Scheme[] = [
  {
    id: 'pm-kisan',
    name: { en: 'PM-KISAN', ta: 'பிஎம் கிசான்' },
    by: { en: 'Government of India', ta: 'இந்திய அரசு' },
    benefit: { en: '₹6,000 a year, in 3 instalments', ta: 'ஆண்டுக்கு ₹6,000, 3 தவணைகளில்' },
    cashPerYear: 6000, icon: Wheat, tone: 'green', scope: 'member', link: 'https://pmkisan.gov.in',
    rules: [
      rule({ key: 'occupation', test: ((v: Occupation) => v === 'farmer') as (v: never) => boolean, need: { en: 'Works as a farmer', ta: 'விவசாயம் செய்பவர்' },
        fix: { en: 'Only for farming families. If you farm, change your work to Farmer.', ta: 'விவசாயக் குடும்பங்களுக்கு மட்டும். விவசாயம் செய்தால், வேலையை "விவசாயி" என மாற்றவும்.' } }),
      rule({ key: 'ownsLand', test: ((v: boolean) => v) as (v: never) => boolean, need: { en: 'Owns farm land in their name', ta: 'சொந்தப் பெயரில் விவசாய நிலம் உள்ளவர்' },
        fix: { en: 'Get the land record (patta) in your name at the taluk office.', ta: 'வட்டாட்சியர் அலுவலகத்தில் பட்டாவை உங்கள் பெயருக்கு மாற்றவும்.' } }),
    ],
    documents: ['aadhaar', 'land', 'bank'],
    fields: [F.name, F.aadhaar, F.fatherName, F.district, F.village, F.surveyNo, F.bankAccount, F.ifsc, F.mobile],
  },
  {
    id: 'cmchis',
    name: { en: 'CM Health Insurance (CMCHIS + PM-JAY)', ta: 'முதலமைச்சர் மருத்துவக் காப்பீடு (CMCHIS + PM-JAY)' },
    by: { en: 'Government of Tamil Nadu · with Ayushman Bharat', ta: 'தமிழ்நாடு அரசு · ஆயுஷ்மான் பாரத்துடன்' },
    benefit: { en: 'Cashless treatment up to ₹5 lakh a year for the family', ta: 'குடும்பத்திற்கு ஆண்டுக்கு ₹5 லட்சம் வரை பணமில்லா சிகிச்சை' },
    cashPerYear: 0, icon: HeartPulse, tone: 'pink', scope: 'household', link: 'https://www.cmchistn.com',
    rules: [r.income(120000, '1.2')],
    documents: ['aadhaar', 'ration', 'income'],
    fields: [F.name, F.aadhaar, F.rationCard, F.income, F.district, F.mobile],
  },
  {
    id: 'kmut',
    name: { en: 'Kalaignar Magalir Urimai Thogai', ta: 'கலைஞர் மகளிர் உரிமைத் தொகை' },
    by: { en: 'Government of Tamil Nadu', ta: 'தமிழ்நாடு அரசு' },
    benefit: { en: '₹1,000 a month for the woman head of the family', ta: 'குடும்பத் தலைவிக்கு மாதம் ₹1,000' },
    cashPerYear: 12000, icon: HandHeart, tone: 'orange', scope: 'member', link: 'https://kmut.tn.gov.in',
    rules: [
      r.female as Rule,
      rule({ key: 'age', test: ((v: number) => v >= 21) as (v: never) => boolean, need: { en: 'Age 21 or above', ta: 'வயது 21 அல்லது அதற்கு மேல்' } }),
      r.income(250000, '2.5'),
      rule({ key: 'isHeadOfFamily', test: ((v: boolean) => v) as (v: never) => boolean,
        need: { en: 'Woman head of the family (named head on the ration card, or wife of the head)', ta: 'குடும்பத் தலைவி (குடும்ப அட்டையில் தலைவர் அல்லது தலைவரின் மனைவி)' },
        fix: { en: 'One woman per ration card can apply: the woman named as head, or the wife of the male head.', ta: 'ஒரு குடும்ப அட்டைக்கு ஒருவர்: தலைவியாக உள்ளவர் அல்லது ஆண் தலைவரின் மனைவி விண்ணப்பிக்கலாம்.' } }),
    ],
    documents: ['aadhaar', 'ration', 'bank'],
    fields: [F.name, F.aadhaar, F.rationCard, F.district, F.bankAccount, F.ifsc, F.mobile],
  },
  {
    id: 'pudhumai-penn',
    name: { en: 'Pudhumai Penn', ta: 'புதுமைப் பெண்' },
    by: { en: 'Government of Tamil Nadu', ta: 'தமிழ்நாடு அரசு' },
    benefit: { en: '₹1,000 a month while in college', ta: 'கல்லூரிப் படிப்பின் போது மாதம் ₹1,000' },
    cashPerYear: 12000, icon: GraduationCap, tone: 'violet', scope: 'member', link: 'https://penkalvi.tn.gov.in',
    rules: [
      { ...(r.female as Rule), fix: { en: 'Boys can get the same support from Tamil Pudhalvan.', ta: 'மாணவர்களுக்கு இதே உதவி தமிழ்ப் புதல்வன் திட்டத்தில் கிடைக்கும்.' } },
      r.student as Rule, r.collegeAge as Rule, r.govtSchool as Rule,
    ],
    documents: ['aadhaar', 'school', 'college', 'bank'],
    fields: [F.name, F.aadhaar, F.college, F.bankAccount, F.ifsc, F.mobile],
  },
  {
    id: 'tamil-pudhalvan',
    name: { en: 'Tamizh Pudhalvan', ta: 'தமிழ்ப் புதல்வன்' },
    by: { en: 'Government of Tamil Nadu', ta: 'தமிழ்நாடு அரசு' },
    benefit: { en: '₹1,000 a month while in college', ta: 'கல்லூரிப் படிப்பின் போது மாதம் ₹1,000' },
    cashPerYear: 12000, icon: BookOpen, tone: 'indigo', scope: 'member', link: 'https://umisdashboard.tnega.org',
    rules: [r.male as Rule, r.student as Rule, r.collegeAge as Rule, r.govtSchool as Rule],
    documents: ['aadhaar', 'school', 'college', 'bank'],
    fields: [F.name, F.aadhaar, F.college, F.bankAccount, F.ifsc, F.mobile],
  },
  {
    id: 'pmay-g',
    name: { en: 'PM Awas Yojana – Gramin', ta: 'பிரதமர் வீட்டு வசதித் திட்டம் – கிராமின்' },
    by: { en: 'Government of India', ta: 'இந்திய அரசு' },
    benefit: { en: '₹1.2 lakh to build a pucca house', ta: 'கான்கிரீட் வீடு கட்ட ₹1.2 லட்சம்' },
    cashPerYear: 0, icon: House, tone: 'amber', scope: 'household', link: 'https://pmayg.nic.in',
    rules: [
      rule({ key: 'ownsPuccaHouse', test: ((v: boolean) => !v) as (v: never) => boolean, need: { en: "Family doesn't own a pucca house", ta: 'குடும்பத்திற்குச் சொந்தக் கான்கிரீட் வீடு இல்லை' },
        fix: { en: 'Only for families without a pucca house.', ta: 'கான்கிரீட் வீடு இல்லாத குடும்பங்களுக்கு மட்டும்.' } }),
      r.income(300000, '3'),
    ],
    documents: ['aadhaar', 'bank', 'jobcard'],
    fields: [F.name, F.aadhaar, F.fatherName, F.district, F.village, F.bankAccount, F.ifsc, F.mobile],
  },
  {
    id: 'old-age-pension',
    name: { en: 'Old Age Pension (Tamil Nadu)', ta: 'முதியோர் ஓய்வூதியம் (தமிழ்நாடு)' },
    by: { en: 'Government of India · Tamil Nadu', ta: 'இந்திய அரசு · தமிழ்நாடு' },
    benefit: { en: '₹1,200 a month pension', ta: 'மாதம் ₹1,200 ஓய்வூதியம்' },
    cashPerYear: 14400, icon: Landmark, tone: 'teal', scope: 'member', link: 'https://nsap.nic.in',
    rules: [
      rule({ key: 'age', test: ((v: number) => v >= 60) as (v: never) => boolean, need: { en: 'Age 60 or above', ta: 'வயது 60 அல்லது அதற்கு மேல்' },
        fix: { en: 'Can apply after turning 60. Add your parents to check it for them.', ta: '60 வயதுக்குப் பிறகு விண்ணப்பிக்கலாம். உங்கள் பெற்றோரைச் சேர்த்துச் சரிபார்க்கவும்.' } }),
      r.income(100000, '1'),
    ],
    documents: ['aadhaar', 'age', 'income', 'bank'],
    fields: [F.name, F.age, F.aadhaar, F.income, F.bankAccount, F.ifsc, F.pincode],
  },
  {
    id: 'ujjwala',
    name: { en: 'PM Ujjwala Yojana', ta: 'பிரதமர் உஜ்வாலா திட்டம்' },
    by: { en: 'Government of India', ta: 'இந்திய அரசு' },
    benefit: { en: 'Free LPG gas connection', ta: 'இலவச எல்பிஜி சமையல் எரிவாயு இணைப்பு' },
    cashPerYear: 0, icon: Flame, tone: 'red', scope: 'member', link: 'https://www.pmuy.gov.in',
    rules: [
      r.female as Rule,
      rule({ key: 'age', test: ((v: number) => v >= 18) as (v: never) => boolean, need: { en: 'Age 18 or above', ta: 'வயது 18 அல்லது அதற்கு மேல்' } }),
      rule({ key: 'hasLpg', test: ((v: boolean) => !v) as (v: never) => boolean, need: { en: 'No LPG connection at home yet', ta: 'வீட்டில் இன்னும் எல்பிஜி இணைப்பு இல்லை' },
        fix: { en: 'Only for homes without an LPG connection.', ta: 'எல்பிஜி இணைப்பு இல்லாத வீடுகளுக்கு மட்டும்.' } }),
      r.income(200000, '2'),
    ],
    documents: ['aadhaar', 'ration', 'bank'],
    fields: [F.name, F.aadhaar, F.rationCard, F.bankAccount, F.ifsc, F.pincode],
  },
  {
    id: 'pmjjby',
    name: { en: 'PM Jeevan Jyoti Bima Yojana', ta: 'பிரதமர் ஜீவன் ஜோதி காப்பீடு' },
    by: { en: 'Government of India', ta: 'இந்திய அரசு' },
    benefit: { en: '₹2 lakh life cover for ₹436 a year', ta: 'ஆண்டுக்கு ₹436-க்கு ₹2 லட்சம் ஆயுள் காப்பீடு' },
    cashPerYear: 0, icon: ShieldCheck, tone: 'blue', scope: 'member', link: 'https://jansuraksha.gov.in',
    rules: [
      rule({ key: 'age', test: ((v: number) => v >= 18 && v <= 50) as (v: never) => boolean, need: { en: 'Age 18 to 50', ta: 'வயது 18 முதல் 50' } }),
      r.bank as Rule,
    ],
    documents: ['aadhaar', 'bank'],
    fields: [F.name, F.age, F.aadhaar, F.bankAccount, F.ifsc, F.nominee],
  },
  {
    id: 'e-shram',
    name: { en: 'e-Shram card', ta: 'இ-ஷ்ரம் அட்டை' },
    by: { en: 'Ministry of Labour, Government of India', ta: 'தொழிலாளர் அமைச்சகம், இந்திய அரசு' },
    benefit: { en: 'Free worker ID (UAN card) for welfare schemes', ta: 'நலத்திட்டங்களுக்கான இலவச தொழிலாளர் அடையாள அட்டை (UAN)' },
    cashPerYear: 0, icon: HardHat, tone: 'slate', scope: 'member', link: 'https://eshram.gov.in',
    rules: [
      rule({ key: 'age', test: ((v: number) => v >= 16 && v <= 59) as (v: never) => boolean, need: { en: 'Age 16 to 59', ta: 'வயது 16 முதல் 59' } }),
      rule({ key: 'occupation', test: ((v: Occupation) => ['daily_wage', 'farmer', 'business'].includes(v)) as (v: never) => boolean,
        need: { en: 'Unorganised work: daily wage, farm work or small self-employment', ta: 'அமைப்புசாரா வேலை: தினக்கூலி, விவசாய வேலை அல்லது சிறு சுயதொழில்' },
        fix: { en: 'For unorganised workers. Salaried workers with PF or ESI are covered by other schemes.', ta: 'அமைப்புசாரா தொழிலாளர்களுக்கு. PF / ESI உள்ள சம்பளதாரர்களுக்கு வேறு திட்டங்கள் உள்ளன.' } }),
      rule({ key: 'ownsLand', test: ((v: boolean) => !v) as (v: never) => boolean, when: (m) => m.occupation === 'farmer',
        need: { en: 'Farmers: landless or agricultural labourer', ta: 'விவசாயிகள்: நிலமற்றவர் அல்லது விவசாயக் கூலித் தொழிலாளர்' },
        fix: { en: 'Farmers who own land are covered by PM-KISAN instead.', ta: 'நிலம் உள்ள விவசாயிகளுக்கு பிஎம் கிசான் திட்டம் உள்ளது.' } }),
    ],
    documents: ['aadhaar'],
    fields: [F.name, F.age, F.aadhaar, F.occupation, F.bankAccount, F.ifsc, F.mobile],
  },
]

export function schemeById(id: string): Scheme | undefined {
  return SCHEMES.find((s) => s.id === id)
}
