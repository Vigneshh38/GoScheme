import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react'
import type { AppState, HouseholdFacts, Lang, Member, MemberFacts, SavedForm, Text } from './types'
import { translate, type StrKey } from './i18n'
import { pickText } from './lang'
import { loadState, saveState, wipeState } from './lib/store'

export const EMPTY: AppState = { lang: 'en', consented: false, onboarded: false, household: {}, members: [], forms: [] }

type Action =
  | { type: 'load'; state: AppState }
  | { type: 'lang'; lang: Lang }
  | { type: 'consent' }
  | { type: 'upsertMember'; member: Member }
  | { type: 'memberFact'; id: string; patch: Partial<MemberFacts & { name: string }> }
  | { type: 'household'; patch: Partial<HouseholdFacts> }
  | { type: 'removeMember'; id: string }
  | { type: 'onboarded' }
  | { type: 'addForm'; form: SavedForm }
  | { type: 'formStatus'; id: string; patch: Pick<SavedForm, 'status' | 'submittedAt' | 'remindAt'> }
  | { type: 'reset' }

function reducer(s: AppState, a: Action): AppState {
  switch (a.type) {
    case 'load': return a.state
    case 'lang': return { ...s, lang: a.lang }
    case 'consent': return { ...s, consented: true }
    case 'upsertMember': {
      const exists = s.members.some((m) => m.id === a.member.id)
      return { ...s, members: exists ? s.members.map((m) => (m.id === a.member.id ? a.member : m)) : [...s.members, a.member] }
    }
    case 'memberFact': return { ...s, members: s.members.map((m) => (m.id === a.id ? { ...m, ...a.patch } : m)) }
    case 'household': return { ...s, household: { ...s.household, ...a.patch } }
    case 'removeMember': return { ...s, members: s.members.filter((m) => m.id !== a.id), forms: s.forms.filter((f) => f.memberId !== a.id) }
    case 'onboarded': return { ...s, onboarded: true }
    case 'addForm': return { ...s, forms: [a.form, ...s.forms] }
    case 'formStatus': return { ...s, forms: s.forms.map((f) => (f.id === a.id ? { ...f, ...a.patch } : f)) }
    case 'reset': return { ...EMPTY, lang: s.lang }
  }
}

type Ctx = {
  state: AppState
  ready: boolean
  dispatch: (a: Action) => void
  lang: Lang
  t: (key: StrKey, vars?: Record<string, string | number>) => string
  pick: (text: Text) => string
  owner: Member | undefined
  wipe: () => Promise<void>
}

const AppCtx = createContext<Ctx | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, EMPTY)
  const [ready, setReady] = useState(false)
  const skipSave = useRef(true)

  useEffect(() => {
    loadState().then((saved) => {
      if (saved) dispatch({ type: 'load', state: { ...EMPTY, ...saved } })
      setReady(true)
    })
  }, [])

  useEffect(() => {
    if (!ready) return
    if (skipSave.current) { skipSave.current = false; return }
    const id = setTimeout(() => saveState(state), 250)
    return () => clearTimeout(id)
  }, [state, ready])

  useEffect(() => {
    document.documentElement.lang = state.lang
  }, [state.lang])

  const wipe = useCallback(async () => {
    await wipeState()
    skipSave.current = true
    dispatch({ type: 'reset' })
  }, [])

  const value = useMemo<Ctx>(() => {
    const lang = state.lang
    return {
      state, ready, dispatch, lang,
      t: (key, vars) => translate(lang, key, vars),
      pick: (text) => pickText(text, lang),
      owner: state.members.find((m) => m.relation === 'self'),
      wipe,
    }
  }, [state, ready, wipe])

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}

export function useApp(): Ctx {
  const ctx = useContext(AppCtx)
  if (!ctx) throw new Error('useApp outside AppProvider')
  return ctx
}

export const newId = () => Math.random().toString(36).slice(2, 10)
