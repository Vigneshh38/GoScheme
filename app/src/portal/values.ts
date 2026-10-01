import type { HouseholdFacts, Member } from '../types'
import type { FillValues } from './autofill'
import { districtByName } from '../data/districts'
import { getSecret } from '../lib/secrets'

/**
 * Everything GoScheme knows that a portal may ask for. `filled` is the review screen's
 * values (voice / document fields); the full Aadhaar and account numbers come from memory.
 */
export function portalValues(m: Member, h: HouseholdFacts, filled: Record<string, string | undefined>): FillValues {
  const v: FillValues = {
    name: m.name,
    fatherName: filled.fatherName,
    gender: m.gender === 'female' ? 'Female' : m.gender === 'male' ? 'Male' : undefined,
    state: 'TAMIL NADU',
    district: districtByName(h.district)?.en,
    village: filled.village,
    pincode: filled.pincode?.replace(/\s/g, ''),
    ifsc: filled.ifsc,
    surveyNo: filled.surveyNo,
    college: filled.college,
    mobile: filled.mobile,
    aadhaar: getSecret('aadhaar'),
    bankAccount: getSecret('bankAccount'),
  }
  return Object.fromEntries(Object.entries(v).filter(([, x]) => x)) as FillValues
}
