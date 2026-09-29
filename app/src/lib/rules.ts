import type { FactKey, HouseholdFacts, Member } from '../types'
import { SCHEMES, type Rule, type Scheme } from '../data/schemes'
import { HOUSEHOLD_KEYS } from '../data/questions'

export type Status = 'eligible' | 'maybe' | 'not'

export type RuleCheck = { rule: Rule; state: 'pass' | 'fail' | 'unknown' }

export type Evaluation = {
  scheme: Scheme
  member: Member
  status: Status
  checks: RuleCheck[]
  /** The first fact we still need, when status is "maybe". */
  missing?: FactKey
}

export function factValue(key: FactKey, m: Member, h: HouseholdFacts): unknown {
  return (HOUSEHOLD_KEYS as string[]).includes(key) ? h[key as keyof HouseholdFacts] : m[key as keyof Member]
}

/**
 * All rules pass → eligible. Any rule fails → not eligible (with the reasons).
 * Nothing fails but a fact is unknown → maybe, and we ask for that one fact.
 */
export function evaluate(scheme: Scheme, m: Member, h: HouseholdFacts): Evaluation {
  const checks: RuleCheck[] = scheme.rules.filter((rule) => !rule.when || rule.when(m, h)).map((rule) => {
    const v = factValue(rule.key, m, h)
    if (v === undefined) return { rule, state: 'unknown' }
    return { rule, state: rule.test(v as never) ? 'pass' : 'fail' }
  })
  if (checks.some((c) => c.state === 'fail')) return { scheme, member: m, status: 'not', checks }
  const unknown = checks.find((c) => c.state === 'unknown')
  if (unknown) return { scheme, member: m, status: 'maybe', checks, missing: unknown.rule.key }
  return { scheme, member: m, status: 'eligible', checks }
}

const RANK: Record<Status, number> = { eligible: 0, maybe: 1, not: 2 }

/** One entry per scheme: who in the family it suits best, and everyone it suits. */
export type Match = {
  scheme: Scheme
  best: Evaluation
  /** Everyone for whom this scheme is eligible (member schemes can suit several people). */
  eligibleMembers: Member[]
}

export function matchFamily(members: Member[], h: HouseholdFacts, only?: string): Match[] {
  const owner = members.find((m) => m.relation === 'self') ?? members[0]
  if (!owner) return []
  const people = only ? members.filter((m) => m.id === only) : members
  const out: Match[] = []
  for (const scheme of SCHEMES) {
    // Household schemes cover everyone, so they're checked once, against the owner.
    const evals = scheme.scope === 'household' ? [evaluate(scheme, owner, h)] : people.map((m) => evaluate(scheme, m, h))
    if (evals.length === 0) continue
    const best = [...evals].sort((a, b) => RANK[a.status] - RANK[b.status] || passCount(b) - passCount(a))[0]
    out.push({ scheme, best, eligibleMembers: evals.filter((e) => e.status === 'eligible').map((e) => e.member) })
  }
  // Best match first: eligible before maybe before not; within a group, closest match
  // and larger yearly cash benefit first.
  return out.sort(
    (a, b) =>
      RANK[a.best.status] - RANK[b.best.status] ||
      failCount(a.best) - failCount(b.best) ||
      b.scheme.cashPerYear - a.scheme.cashPerYear,
  )
}

const passCount = (e: Evaluation) => e.checks.filter((c) => c.state === 'pass').length
const failCount = (e: Evaluation) => e.checks.filter((c) => c.state === 'fail').length
