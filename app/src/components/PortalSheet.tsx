/**
 * "Fill the official form": asks for the numbers the portal needs that GoScheme does not
 * keep (full Aadhaar), then opens the official website and fills it.
 */
import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { DemoPortal } from './DemoPortal'
import { Check, Copy, Globe, Lock, PlayCircle } from 'lucide-react'
import { Button, Sheet } from './ui'
import type { Portal } from '../portal/portals'
import { barText, type FillKey, type FillValues } from '../portal/autofill'
import { say } from '../lang'
import { canAutofill, openPortal } from '../portal/openPortal'
import { getSecret, setSecret } from '../lib/secrets'
import { useApp } from '../state'

type Props = { open: boolean; onClose: () => void; portal: Portal; values: FillValues }

const LABEL: Record<FillKey, [string, string]> = {
  aadhaar: ['Aadhaar number', 'ஆதார் எண்'], mobile: ['Mobile number', 'மொபைல் எண்'], name: ['Name', 'பெயர்'],
  fatherName: ["Father's / husband's name", 'தந்தை / கணவர் பெயர்'], gender: ['Gender', 'பாலினம்'], state: ['State', 'மாநிலம்'],
  district: ['District', 'மாவட்டம்'], village: ['Village', 'கிராமம்'], pincode: ['Pincode', 'அஞ்சல் குறியீடு'],
  ifsc: ['IFSC code', 'IFSC குறியீடு'], bankAccount: ['Bank account', 'வங்கிக் கணக்கு'], surveyNo: ['Survey number', 'அளவை எண்'],
  umisId: ['UMIS / EMIS ID (from your college)', 'UMIS / EMIS எண் (கல்லூரியில் பெறவும்)'],
  college: ['College name', 'கல்லூரியின் பெயர்'],
}

export function PortalSheet({ open, onClose, portal, values }: Props) {
  const { t, pick, lang } = useApp()
  const label = (k: FillKey) => say(lang, LABEL[k][0], LABEL[k][1])
  const [aadhaar, setAadhaar] = useState(getSecret('aadhaar') ?? '')
  const [mobile, setMobile] = useState(values.mobile ?? '')
  const [umisId, setUmisId] = useState(values.umisId ?? '')
  const [error, setError] = useState<string | null>(null)
  const [openedTab, setOpenedTab] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [demo, setDemo] = useState(false)

  const needsAadhaar = portal.needs.includes('aadhaar')
  const needsMobile = portal.needs.includes('mobile')
  const needsUmis = portal.needs.includes('umisId')
  const all: FillValues = {
    ...values,
    ...(aadhaar ? { aadhaar: aadhaar.replace(/\s/g, '') } : {}),
    ...(mobile ? { mobile } : {}),
    ...(umisId ? { umisId: umisId.trim() } : {}),
  }

  const go = async () => {
    const a = aadhaar.replace(/\s/g, '')
    if (needsAadhaar && !/^[2-9]\d{11}$/.test(a)) return setError(t('badAadhaar'))
    if (needsMobile && !/^[6-9]\d{9}$/.test(mobile)) return setError(t('badMobile'))
    if (needsUmis && !/^[A-Za-z0-9]{6,}$/.test(umisId.trim())) return setError(say(lang, 'Enter your UMIS / EMIS ID', 'சரியான UMIS / EMIS எண்ணை உள்ளிடவும்'))
    setError(null)
    if (a) setSecret('aadhaar', a)
    const finalValues: FillValues = {
      ...all,
      ...(a ? { aadhaar: a } : {}),
      ...(mobile ? { mobile } : {}),
    }
    const how = await openPortal(portal.url, pick(portal.name), { values: finalValues, exact: portal.exact, text: barText(lang) })
    if (how === 'opened-tab') setOpenedTab(true)
    else onClose()
  }

  const validAadhaar = all.aadhaar && all.aadhaar.replace(/\D/g, '').length === 12
    ? all.aadhaar
    : '234567890123'
  const validMobile = all.mobile && all.mobile.replace(/\D/g, '').length === 10
    ? all.mobile
    : '9876543210'

  // Demo data: the person's own details where known, sample values for the rest.
  const demoValues: FillValues = {
    name: all.name || 'Murugan Kannan', gender: all.gender || 'Male', district: all.district || 'Madurai',
    fatherName: all.fatherName || 'Kannan', college: all.college || 'Govt Arts College, Madurai',
    bankAccount: all.bankAccount || '50100234567890', ifsc: all.ifsc || 'SBIN0001234',
    ...all,
    umisId: all.umisId || 'DEMO2026TN0142',
    aadhaar: validAadhaar,
    mobile: validMobile,
    state: 'TAMIL NADU',
  }

  const copy = (key: string, text: string) => {
    navigator.clipboard?.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(null), 1500) }, () => {})
  }

  const shown = (Object.keys(LABEL) as FillKey[]).filter((k) => all[k])

  return (
    <>
    <Sheet open={open} onClose={onClose} label={t('fillOfficial')}>
      <div className="sheet-body portal">
        <span className="portal-ic"><Globe size={26} /></span>
        <h2 className="h2">{pick(portal.name)}</h2>
        {!openedTab ? (
          <>
            <p className="lead">{t('portalLead')}</p>
            {needsAadhaar && (
              <label className="portal-field">
                <span>{t('aadhaarFull')}</span>
                <input className="field" id="portal-aadhaar" inputMode="numeric" autoComplete="off" maxLength={14}
                  value={aadhaar} onChange={(e) => setAadhaar(e.target.value.replace(/[^\d ]/g, ''))} />
              </label>
            )}
            {needsMobile && (
              <label className="portal-field">
                <span>{label('mobile')}</span>
                <input className="field" id="portal-mobile" inputMode="numeric" maxLength={10}
                  value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))} />
              </label>
            )}
            {needsUmis && (
              <label className="portal-field">
                <span>{label('umisId')}</span>
                <input className="field" id="portal-umis" autoComplete="off" autoCapitalize="characters" maxLength={20}
                  value={umisId} onChange={(e) => setUmisId(e.target.value.replace(/[^A-Za-z0-9]/g, ''))} />
              </label>
            )}
            <p className="portal-note"><Lock size={14} /> {t('notSaved')}</p>
            <div className="portal-you">
              <b>{t('youDo')}</b>
              <p>{pick(portal.youDo)}</p>
            </div>
            {error && <p className="input-error">{error}</p>}
            <Button block icon={Globe} onClick={go}>{t('fillOfficial')}</Button>
            {portal.demo && (
              <Button block variant="secondary" icon={PlayCircle} onClick={() => { onClose(); setDemo(true) }}>{t('demoPortal')}</Button>
            )}
            {!canAutofill && <p className="fineprint">{t('webOnlyNote')}</p>}
          </>
        ) : (
          <>
            <p className="lead">{t('copyEach')}</p>
            <ul className="copy-list">
              {shown.map((k) => (
                <li key={k}>
                  <span><small>{label(k)}</small><b>{all[k]}</b></span>
                  <button type="button" className="icon-btn" onClick={() => copy(k, all[k]!)} aria-label={t('copy')}>
                    {copied === k ? <Check size={17} /> : <Copy size={17} />}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </Sheet>
    <AnimatePresence>
      {demo && portal.demo && (
        <DemoPortal src={portal.demo} title={pick(portal.name)} onClose={() => setDemo(false)}
          cfg={{ values: demoValues, exact: portal.exact, text: barText(lang) }} />
      )}
    </AnimatePresence>
    </>
  )
}
