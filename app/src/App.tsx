import { useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { AppProvider, newId, useApp } from './state'
import { Welcome } from './screens/Welcome'
import { Consent } from './screens/Consent'
import { Onboarding } from './screens/Onboarding'
import { Confirm } from './screens/Confirm'
import { AddMember } from './screens/AddMember'
import { Main, type Tab } from './screens/Main'
import { SchemeDetail } from './screens/SchemeDetail'
import { Apply } from './screens/Apply'
import { FormView } from './screens/FormView'
import { MEMBER_FLOW, OWNER_FLOW } from './data/questions'
import { Logo } from './components/Logo'
import type { Relation } from './types'
import { preloadVoice } from './lib/speech'

preloadVoice()

type Route =
  | { name: 'welcome' }
  | { name: 'consent' }
  | { name: 'onboard'; memberId: string }
  | { name: 'confirm'; memberId: string }
  | { name: 'addMember' }
  | { name: 'main'; tab: Tab }
  | { name: 'scheme'; schemeId: string; memberId?: string }
  | { name: 'apply'; schemeId: string; memberId: string }
  | { name: 'form'; formId: string; fresh: boolean }

function Router() {
  const { state, ready, dispatch, owner } = useApp()
  const reduce = useReducedMotion()
  const [stack, setStack] = useState<Route[]>([])

  // Where to start: first launch, half-finished onboarding, or the scheme list.
  useEffect(() => {
    if (!ready) return
    if (!state.consented) setStack([{ name: 'welcome' }])
    else if (!state.onboarded && owner) setStack([{ name: 'onboard', memberId: owner.id }])
    else if (!state.onboarded) setStack([{ name: 'welcome' }])
    else setStack((s) => (s.length ? s : [{ name: 'main', tab: 'schemes' }]))
    // Only on load and after "Delete all my data".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, state.consented])

  const route = stack[stack.length - 1]
  const go = (r: Route) => setStack((s) => [...s, r])
  const replace = (r: Route) => setStack((s) => [...s.slice(0, -1), r])
  const back = () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s))
  const reset = (r: Route) => setStack([r])

  if (!ready || !route) {
    return <div className="screen screen--center"><Logo /></div>
  }

  const memberOf = (id: string) => state.members.find((m) => m.id === id)
  const flowFor = (id: string) => (memberOf(id)?.relation === 'self' ? OWNER_FLOW : MEMBER_FLOW)

  const startMember = (relation: Relation) => {
    const id = newId()
    dispatch({ type: 'upsertMember', member: { id, relation, name: '' } })
    replace({ name: 'onboard', memberId: id })
  }

  const leaveMemberFlow = (id: string) => {
    // Abandoned before giving a name: don't keep an empty profile.
    if (memberOf(id)?.relation !== 'self' && !memberOf(id)?.name) dispatch({ type: 'removeMember', id })
    back()
  }

  let screen: ReactNode = null
  switch (route.name) {
    case 'welcome':
      screen = <Welcome onChoose={() => go({ name: 'consent' })} />
      break
    case 'consent':
      screen = (
        <Consent
          onBack={back}
          onAgree={() => {
            dispatch({ type: 'consent' })
            const id = owner?.id ?? newId()
            if (!owner) dispatch({ type: 'upsertMember', member: { id, relation: 'self', name: '' } })
            reset({ name: 'onboard', memberId: id })
          }}
        />
      )
      break
    case 'onboard': {
      const m = memberOf(route.memberId)
      if (!m) break
      screen = (
        <Onboarding
          member={m}
          flow={flowFor(m.id)}
          onDone={() => go({ name: 'confirm', memberId: m.id })}
          onExit={() => (m.relation === 'self' ? reset({ name: 'welcome' }) : leaveMemberFlow(m.id))}
        />
      )
      break
    }
    case 'confirm': {
      const m = memberOf(route.memberId)
      if (!m) break
      screen = (
        <Confirm
          member={m}
          flow={flowFor(m.id)}
          onBack={back}
          onDone={() => {
            if (m.relation === 'self') dispatch({ type: 'onboarded' })
            reset({ name: 'main', tab: 'schemes' })
          }}
        />
      )
      break
    }
    case 'addMember':
      screen = <AddMember onBack={back} onPick={startMember} />
      break
    case 'main':
      screen = (
        <Main
          tab={route.tab}
          setTab={(tab) => replace({ name: 'main', tab })}
          openScheme={(schemeId, memberId) => go({ name: 'scheme', schemeId, memberId })}
          openForm={(formId) => go({ name: 'form', formId, fresh: false })}
          addMember={() => go({ name: 'addMember' })}
        />
      )
      break
    case 'scheme':
      screen = <SchemeDetail schemeId={route.schemeId} memberId={route.memberId} onBack={back} onApply={(memberId) => go({ name: 'apply', schemeId: route.schemeId, memberId })} />
      break
    case 'apply':
      screen = <Apply schemeId={route.schemeId} memberId={route.memberId} onBack={back} onCreated={(formId) => replace({ name: 'form', formId, fresh: true })} />
      break
    case 'form':
      screen = <FormView formId={route.formId} fresh={route.fresh} onBack={back} onHome={() => reset({ name: 'main', tab: 'schemes' })} />
      break
  }

  const key = `${route.name}:${'memberId' in route ? route.memberId : ''}:${'schemeId' in route ? route.schemeId : ''}:${'formId' in route ? route.formId : ''}`
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={key}
        className="route"
        initial={reduce ? { opacity: 0 } : { opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, x: -24 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        {screen}
      </motion.div>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <AppProvider>
      <div className="app">
        <Router />
      </div>
    </AppProvider>
  )
}
