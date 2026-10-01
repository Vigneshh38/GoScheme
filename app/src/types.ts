export type Lang = 'en' | 'ta' | 'hi' | 'te' | 'kn'

/**
 * A piece of text. English and Tamil are written next to each other in the code; Hindi,
 * Telugu and Kannada usually come from the dictionaries in src/lang (looked up by the
 * English text), but can also be given inline.
 */
export type Text = { en: string; ta: string; hi?: string; te?: string; kn?: string }

export type Relation = 'self' | 'spouse' | 'child' | 'parent' | 'sibling' | 'other'
export type Gender = 'male' | 'female' | 'other'
export type Occupation =
  | 'farmer'
  | 'student'
  | 'daily_wage'
  | 'salaried'
  | 'business'
  | 'homemaker'
  | 'unemployed'
  | 'retired'

/** Facts that belong to one person. */
export type MemberFacts = {
  age?: number
  gender?: Gender
  occupation?: Occupation
  ownsLand?: boolean
  studiedGovtSchool?: boolean
  isHeadOfFamily?: boolean
  hasBankAccount?: boolean
}

/** Facts shared by the whole family. */
export type HouseholdFacts = {
  income?: number
  district?: string
  familySize?: number
  ownsPuccaHouse?: boolean
  hasLpg?: boolean
}

export type FactKey = keyof MemberFacts | keyof HouseholdFacts

export type Member = MemberFacts & {
  id: string
  relation: Relation
  name: string
}

export type FormField = { label: string; value: string }

export type SavedForm = {
  id: string
  schemeId: string
  memberId: string
  createdAt: number
  fields: FormField[]
  documents: string[]
  /** Where the application is; missing on forms saved before tracking existed (= ready). */
  status?: FormStatus
  submittedAt?: number
  /** When to remind the person to check the status (set when submitted). */
  remindAt?: number
}

export type FormStatus = 'ready' | 'submitted' | 'approved' | 'rejected'

export type AppState = {
  lang: Lang
  consented: boolean
  onboarded: boolean
  household: HouseholdFacts
  members: Member[]
  forms: SavedForm[]
}
