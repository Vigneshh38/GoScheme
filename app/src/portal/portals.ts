/**
 * Official portals GoScheme can fill inside its Android app. Selectors were read from the
 * live pages on 2026-09-29; portals change, so re-check them if filling stops working.
 */
import type { Text } from '../types'
import type { ExactField, FillKey } from './autofill'

export type Portal = {
  name: Text
  url: string
  /** Values the first step of the portal cannot do without. */
  needs: FillKey[]
  exact: ExactField[]
  /** What the person still does on the portal. */
  youDo: Text
  /** A demo copy of the portal bundled in public/, for showing the auto-fill offline. */
  demo?: string
}

// Tamizh Pudhalvan and Pudhumai Penn are applied for on UMIS: log in with the UMIS / EMIS ID,
// then the application form's fields are filled by label.
const UMIS: Omit<Portal, 'name'> = {
  url: 'https://umisdashboard.tnega.org/auth/login',
  needs: ['umisId'],
  exact: [{ selector: '#username', key: 'umisId' }],
  demo: 'demo/umis.html',
  youDo: {
    en: 'Type your UMIS password (first time: last 4 digits of your mobile + your birth year, e.g. 43212006) and the captcha. After login, open the scheme application — GoScheme fills it. Upload the documents it asks for.',
    ta: 'UMIS கடவுச்சொல்லையும் (முதல் முறை: மொபைல் எண்ணின் கடைசி 4 இலக்கங்கள் + பிறந்த ஆண்டு, எ.கா. 43212006) கேப்ட்சாவையும் நீங்களே உள்ளிடவும். உள்நுழைந்த பின் திட்ட விண்ணப்பத்தைத் திறக்கவும் — GoScheme நிரப்பும். கேட்கும் ஆவணங்களைப் பதிவேற்றவும்.',
  },
}

export const PORTALS: Record<string, Portal> = {
  'tamil-pudhalvan': { ...UMIS, name: { en: 'Tamizh Pudhalvan — UMIS login', ta: 'தமிழ்ப் புதல்வன் — UMIS உள்நுழைவு' } },
  'pudhumai-penn': { ...UMIS, demo: 'demo/umis.html?scheme=pudhumai-penn', name: { en: 'Pudhumai Penn — UMIS login', ta: 'புதுமைப் பெண் — UMIS உள்நுழைவு' } },
  'pm-kisan': {
    name: { en: 'PM-KISAN New Farmer Registration', ta: 'பிஎம் கிசான் புதிய விவசாயி பதிவு' },
    url: 'https://pmkisan.gov.in/RegistrationFormupdated.aspx',
    needs: ['aadhaar', 'mobile'],
    exact: [
      { selector: '#txtsrch', key: 'aadhaar' },
      { selector: '#ContentPlaceHolder1_txtMobileNo', key: 'mobile' },
      { selector: '#ContentPlaceHolder1_DropDownState', key: 'state' },
    ],
    youDo: {
      en: 'Type the captcha, then the OTP sent to your Aadhaar-linked mobile.',
      ta: 'கேப்ட்சாவையும், ஆதாருடன் இணைந்த மொபைலுக்கு வரும் OTP-ஐயும் நீங்களே உள்ளிடவும்.',
    },
  },
  'e-shram': {
    name: { en: 'e-Shram self registration', ta: 'இ-ஷ்ரம் சுயப் பதிவு' },
    url: 'https://register.eshram.gov.in/#/user/self',
    needs: ['mobile'],
    exact: [
      { selector: '#mobileNumber', key: 'mobile' },
      // Only unorganised workers without PF / ESI are eligible, so both answers are "No".
      { selector: '#epfo_no', choose: true },
      { selector: '#esic_no', choose: true },
    ],
    youDo: {
      en: 'Type the captcha, then the OTPs sent to your mobile and Aadhaar-linked mobile.',
      ta: 'கேப்ட்சாவையும், உங்கள் மொபைலுக்கு வரும் OTP-களையும் நீங்களே உள்ளிடவும்.',
    },
  },
}

export function portalFor(schemeId: string): Portal | undefined {
  return PORTALS[schemeId]
}
