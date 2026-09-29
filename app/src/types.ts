export type Lang = 'en' | 'ta'

/** A piece of text in both app languages. */
export type Text = { en: string; ta: string }

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
}

export type AppState = {
  lang: Lang
  consented: boolean
  onboarded: boolean
  household: HouseholdFacts
  members: Member[]
  forms: SavedForm[]
}
