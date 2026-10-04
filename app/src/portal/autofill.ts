/**
 * Fills an official government portal with the user's answers. The function below is
 * serialised with `toString()` and run *inside the portal page* by the Android in-app
 * browser, so it must stay self-contained (no imports, no outer variables).
 *
 * - Known fields are filled by exact selector; later steps are matched using priority:
 *   1. Exact selectors
 *   2. id
 *   3. name
 *   4. placeholder
 *   5. associated <label>
 *   6. nearby field text
 *   7. aria-label / accessible attributes
 * - Aadhaar supports either a single 12-digit input or multiple segmented input boxes.
 * - State field dynamically selects 'TAMIL NADU' using <select> option value/text.
 * - CAPTCHA and OTP boxes are NEVER auto-filled, solved, or bypassed: they are detected
 *   and highlighted with an orange outline for human completion.
 * - NO auto-submission or auto-clicking of government Continue / Get OTP / Submit buttons.
 * - A persistent GoScheme status bar at the bottom shows progress and CAPTCHA handoff state.
 * - A MutationObserver re-runs the fill when the portal shows dynamically rendered fields.
 */

import type { Lang } from '../types'
import { say } from '../lang'

export type FillKey =
  | 'aadhaar' | 'mobile' | 'name' | 'fatherName' | 'gender' | 'state' | 'district' | 'village'
  | 'pincode' | 'ifsc' | 'bankAccount' | 'surveyNo' | 'umisId' | 'college'

export type FillValues = Partial<Record<FillKey, string>>

/** `choose` ticks a radio/checkbox; `key` fills from the values. */
export type ExactField = { selector: string; key?: FillKey; choose?: true }

/** The GoScheme bar's sentences, in the person's language ({n} is filled in). */
export type BarText = {
  filled: string
  filledOne: string
  captcha: string
  ready: string
  cont: string
  needCaptcha: string
  noButton: string
  auto: string
  stop: string
  doneCaptcha: string
}

export type AutofillConfig = {
  values: FillValues
  exact: ExactField[]
  text: BarText
}

export type PortalHandoffState = {
  status: 'captcha-required' | 'filled' | 'idle'
  filledCount: number
  captchaDetected: boolean
}

export function barText(lang: Lang): BarText {
  return {
    filled: say(lang, 'GoScheme filled {n} fields', 'GoScheme {n} விவரங்களை நிரப்பியது'),
    filledOne: say(lang, 'GoScheme filled 1 field', 'GoScheme 1 விவரத்தை நிரப்பியது'),
    captcha: say(lang, 'Details filled. Please complete the CAPTCHA yourself.', 'விவரங்கள் நிரப்பப்பட்டன. கேப்ட்சாவை நீங்களே உள்ளிடவும்.'),
    ready: say(lang, 'Check the details, then tap Continue', 'சரிபார்த்துவிட்டு "தொடர்" அழுத்தவும்'),
    cont: say(lang, 'Continue', 'தொடர்'),
    needCaptcha: say(lang, 'Complete the CAPTCHA yourself', 'கேப்ட்சாவை நீங்களே உள்ளிடவும்'),
    noButton: say(lang, "Couldn't find the next button — tap the website's own button", 'இந்தப் பக்கத்தில் தொடர் பொத்தான் இல்லை — இணையதளத்தின் பொத்தானை அழுத்தவும்'),
    auto: say(lang, 'Details filled', 'விவரங்கள் நிரப்பப்பட்டன'),
    stop: say(lang, 'Stop', 'நிறுத்து'),
    doneCaptcha: say(lang, 'Done — Complete CAPTCHA', 'முடிந்தது — கேப்ட்சா உள்ளிடவும்'),
  }
}

export function portalAutofill(cfg: AutofillConfig): void {
  const w = window as unknown as Record<string, unknown>
  w.__gsConfig = cfg
  if (w.__gsInstalled) {
    ;(w.__gsRun as () => void)?.()
    return
  }
  w.__gsInstalled = true

  const T = cfg.text
  const TXT = {
    filled: (n: number) => (n === 1 ? T.filledOne : T.filled.split('{n}').join(String(n))),
    captcha: T.captcha,
    ready: T.ready,
    cont: T.cont,
    needCaptcha: T.needCaptcha,
    noButton: T.noButton,
    stop: T.stop,
    doneCaptcha: T.doneCaptcha,
  }

  // Safe masking helper: never log raw sensitive values
  const maskSensitive = (val?: string) => {
    if (!val) return ''
    const d = val.replace(/\D/g, '')
    return d.length >= 4 ? `XXXX XXXX ${d.slice(-4)}` : 'XXXX'
  }

  // Visual cues: Green for filled fields, Orange for human action (CAPTCHA/OTP)
  const mark = (el: HTMLElement, color: string) => {
    el.style.outline = `3px solid ${color}`
    el.style.outlineOffset = '2px'
    el.style.transition = 'outline 0.2s ease-in-out'
  }

  const visible = (el: Element): boolean => {
    if (!(el instanceof HTMLElement)) return false
    const r = el.getBoundingClientRect()
    if (r.width <= 0 || r.height <= 0) return false
    const s = window.getComputedStyle(el)
    return s.visibility !== 'hidden' && s.display !== 'none' && s.opacity !== '0'
  }

  // Priority metadata extraction: id, name, placeholder, label, nearby text, aria attributes
  const getFieldInfo = (el: HTMLElement) => {
    const id = (el.id || '').trim()
    const name = ((el as HTMLInputElement).name || '').trim()
    const placeholder = (el.getAttribute('placeholder') || '').trim()
    const ariaLabel = (el.getAttribute('aria-label') || '').trim()
    const ariaLabelledBy = (el.getAttribute('aria-labelledby') || '').trim()
    const formControlName = (el.getAttribute('formcontrolname') || '').trim()
    const className = (el.className || '').toString()

    let labelText = ''
    if (id) {
      try {
        const l = document.querySelector(`label[for="${CSS.escape(id)}"]`)
        if (l) labelText += ' ' + (l.textContent || '')
      } catch (_) {}
    }
    const wrapLabel = el.closest('label')
    if (wrapLabel) labelText += ' ' + (wrapLabel.textContent || '')

    if (ariaLabelledBy) {
      try {
        const l = document.getElementById(ariaLabelledBy)
        if (l) labelText += ' ' + (l.textContent || '')
      } catch (_) {}
    }

    let nearbyText = ''
    const formGroup = el.closest('.form-group, .form-item, .field-wrapper, tr, td, div')
    if (formGroup) {
      const texts = formGroup.querySelectorAll('label, .headingsubtext, span, p, b, strong')
      texts.forEach((t) => {
        if (!t.contains(el)) nearbyText += ' ' + (t.textContent || '')
      })
    }
    const prev = el.previousElementSibling || el.parentElement?.previousElementSibling
    if (prev && !prev.contains(el)) nearbyText += ' ' + (prev.textContent || '')

    const combined = [id, name, placeholder, ariaLabel, formControlName, labelText, nearbyText, className]
      .join(' ')
      .replace(/\s+/g, ' ')
      .toLowerCase()

    return { id, name, placeholder, ariaLabel, labelText, nearbyText, className, combined }
  }

  // CAPTCHA detection: strict rules so CAPTCHA is NEVER filled or solved
  const CAPTCHA_RE = /captcha|capcha|captchacode|security.?code|verification.?code|code.?shown|image.?text|enter.?characters|கேப்ட்சா/i

  const isCaptchaField = (el: HTMLElement): boolean => {
    if (el instanceof HTMLImageElement) return false
    const info = getFieldInfo(el)
    if (
      CAPTCHA_RE.test(info.id) ||
      CAPTCHA_RE.test(info.name) ||
      CAPTCHA_RE.test(info.placeholder) ||
      CAPTCHA_RE.test(info.ariaLabel) ||
      CAPTCHA_RE.test(info.labelText) ||
      CAPTCHA_RE.test(info.className) ||
      CAPTCHA_RE.test(info.nearbyText)
    ) {
      return true
    }
    const parent = el.closest('.form-group, .row, tr, div')
    if (parent) {
      const img = parent.querySelector('img[src*="captcha" i], img[src*="capcha" i], img[id*="captcha" i], img[alt*="capcha" i], img[alt*="captcha" i], .captchaimage, [class*="captcha" i]')
      if (img && el instanceof HTMLInputElement && el.type === 'text') {
        return true
      }
    }
    return false
  }

  const OTP_RE = /\botp\b|one.?time.?password|\bpasscode\b/i
  const isOtpField = (el: HTMLElement): boolean => {
    const info = getFieldInfo(el)
    return OTP_RE.test(info.combined)
  }

  // Login passwords are human typed; note that PM-KISAN renders Aadhaar as type="password",
  // which is Aadhaar, NOT a user password.
  const isUserPasswordField = (el: HTMLElement): boolean => {
    if ((el as HTMLInputElement).type !== 'password') return false
    const info = getFieldInfo(el)
    if (/aadhaa?r|aadhar|\buid\b|ஆதார்/i.test(info.combined)) return false
    return true
  }

  const isHumanVerificationField = (el: HTMLElement): boolean =>
    isCaptchaField(el) || isOtpField(el) || isUserPasswordField(el)

  // Track user modifications so autofill never overwrites manual changes
  document.addEventListener('input', (e) => {
    const target = e.target as HTMLElement
    if (target && target.matches('input, select, textarea')) {
      target.dataset.gsUserEdited = '1'
    }
  }, true)

  const setValue = (el: HTMLElement, value: string): boolean => {
    if (el.dataset.gsUserEdited === '1') return false

    if (el instanceof HTMLSelectElement) {
      const want = value.trim().toLowerCase()
      const opts = Array.from(el.options)
      // Match option value or text (e.g. TAMIL NADU option with value "33")
      const opt =
        opts.find((o) => o.value.trim().toLowerCase() === want) ||
        opts.find((o) => o.text.trim().toLowerCase() === want) ||
        opts.find((o) => o.index > 0 && o.text.trim().toLowerCase().includes(want)) ||
        opts.find((o) => o.index > 0 && want.includes(o.text.trim().toLowerCase()))
      if (!opt) return false
      el.selectedIndex = opt.index
      el.value = opt.value
      for (const type of ['input', 'change', 'blur']) {
        el.dispatchEvent(new Event(type, { bubbles: true }))
      }
      if (typeof (el as unknown as { onchange?: () => void }).onchange === 'function') {
        try { (el as unknown as { onchange: () => void }).onchange() } catch (_) {}
      }
      return true
    }

    if (el instanceof HTMLInputElement && (el.type === 'radio' || el.type === 'checkbox')) {
      if (!el.checked) el.click()
      return true
    }

    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
    if (setter) {
      setter.call(el, value)
    } else {
      ;(el as HTMLInputElement).value = value
    }
    for (const type of ['input', 'change', 'blur']) {
      el.dispatchEvent(new Event(type, { bubbles: true }))
    }
    try {
      el.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: value.slice(-1) }))
    } catch (_) {}
    return true
  }

  // Detect Aadhaar inputs: handles either 1 single 12-digit box OR multiple segmented boxes
  const findAadhaarInputs = (anchorEl?: HTMLElement | null): HTMLElement[] => {
    if (anchorEl) {
      const container = anchorEl.closest('.form-group, .form-row, .row, fieldset, [class*="aadhaar" i], [id*="aadhaar" i]') || anchorEl.parentElement
      if (container) {
        const inputs = Array.from(
          container.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=submit]):not([type=button]):not([type=image])')
        ).filter((node) => {
          const i = node as HTMLElement
          if (!visible(i) || isCaptchaField(i)) return false
          const d = getFieldInfo(i)
          if (/mobile|phone|contact|state|district|email/i.test(d.combined)) return false
          return true
        }) as HTMLElement[]

        if (inputs.length > 1 && inputs.length <= 12 && inputs.includes(anchorEl)) {
          return inputs
        }
      }
      return [anchorEl]
    }

    const allInputs = Array.from(
      document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=submit]):not([type=button]):not([type=image])')
    ).filter((node) => visible(node) && !isCaptchaField(node as HTMLElement)) as HTMLElement[]

    for (const node of allInputs) {
      const desc = getFieldInfo(node)
      if (/aadhaa?r|aadhar|\buid\b|ஆதார்/i.test(desc.combined)) {
        const container = node.closest('.form-group, .form-row, .row, fieldset, [class*="aadhaar" i], [id*="aadhaar" i]') || node.parentElement
        if (container) {
          const group = Array.from(
            container.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=submit]):not([type=button]):not([type=image])')
          ).filter((child) => {
            const i = child as HTMLElement
            if (!visible(i) || isCaptchaField(i)) return false
            const d = getFieldInfo(i)
            if (/mobile|phone|contact|state|district|email/i.test(d.combined)) return false
            return true
          }) as HTMLElement[]

          if (group.length > 1 && group.length <= 12 && group.includes(node)) {
            return group
          }
        }
        return [node]
      }
    }
    return []
  }

  const fillAadhaar = (inputs: HTMLElement[], fullAadhaar: string): boolean => {
    const digits = fullAadhaar.replace(/\D/g, '')
    if (digits.length < 12 || inputs.length === 0) return false

    if (inputs.length === 1) {
      const el = inputs[0]
      if (setValue(el, digits)) {
        el.dataset.gsDone = '1'
        mark(el, '#16a34a')
        return true
      }
      return false
    }

    // Split across multiple input boxes dynamically according to DOM structure
    let offset = 0
    let anyFilled = false
    for (let i = 0; i < inputs.length; i++) {
      const box = inputs[i] as HTMLInputElement
      const remainingBoxes = inputs.length - i
      const remainingDigits = digits.length - offset
      let chunkLen = 0

      if (box.maxLength > 0 && box.maxLength < 12) {
        chunkLen = Math.min(box.maxLength, remainingDigits)
      } else {
        chunkLen = Math.min(remainingDigits, Math.ceil(remainingDigits / remainingBoxes))
      }

      const chunk = digits.substring(offset, offset + chunkLen)
      offset += chunkLen

      if (setValue(box, chunk)) {
        box.dataset.gsDone = '1'
        mark(box, '#16a34a')
        anyFilled = true
      }
    }
    return anyFilled
  }

  // Ordered semantic matching rules: specific to general
  const RULES: [FillKey, RegExp][] = [
    ['umisId', /umis|emis|user.?name|login.?id/i],
    ['aadhaar', /aadhaa?r|aadhar|\buid\b|ஆதார்/i],
    ['mobile', /mobile|phone|contact.?no|கைபேசி|மொபைல்/i],
    ['state', /\bstate\b|மாநில/i],
    ['district', /\bdistrict\b|மாவட்டம்/i],
    ['fatherName', /father|husband|guardian|spouse|தந்தை|கணவர்/i],
    ['village', /village|town|கிராம|ஊர்/i],
    ['pincode', /pin\s*code|pincode|postal|அஞ்சல்/i],
    ['ifsc', /\bifsc\b/i],
    ['bankAccount', /(account|a\/c|acc)\s*(no|number|num)|bank.?account|கணக்கு\s*எண்/i],
    ['surveyNo', /survey|khasra|khata|patta|புல\s*எண்/i],
    ['gender', /gender|\bsex\b|பாலின/i],
    ['college', /college|institution|கல்லூரி/i],
    ['name', /(farmer|applicant|beneficiary|full|worker|student)?\s*name|முழுப்\s*பெயர்|பெயர்/i],
  ]

  let filledTotal = 0
  let captchaCount = 0

  const fill = () => {
    const c = w.__gsConfig as AutofillConfig
    if (!c || !c.values) return

    // 1. Exact fields configured for this portal
    for (const f of c.exact) {
      if (f.key === 'aadhaar' && c.values.aadhaar) {
        const anchor = document.querySelector(f.selector) as HTMLElement | null
        if (anchor && !anchor.dataset.gsDone && visible(anchor)) {
          const group = findAadhaarInputs(anchor)
          if (fillAadhaar(group, c.values.aadhaar)) {
            filledTotal++
          }
        }
        continue
      }

      const el = document.querySelector(f.selector) as HTMLElement | null
      if (!el || el.dataset.gsDone || !visible(el) || (el as HTMLInputElement).disabled || (el as HTMLInputElement).readOnly) continue
      const value = f.choose ? 'x' : f.key ? c.values[f.key] : undefined
      if (value && setValue(el, value)) {
        el.dataset.gsDone = '1'
        mark(el, '#16a34a')
        filledTotal++
      }
    }

    // 2. Scan and highlight human-verification fields (CAPTCHA / OTP / password)
    captchaCount = 0
    const allFormElements = document.querySelectorAll(
      'input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=image]), select, textarea'
    )

    allFormElements.forEach((node) => {
      const el = node as HTMLElement
      if (!visible(el) || (el as HTMLInputElement).disabled || (el as HTMLInputElement).readOnly) return

      if (isHumanVerificationField(el)) {
        mark(el, '#f59e0b')
        captchaCount++
        return
      }

      // Check if Aadhaar is not yet filled and this matches Aadhaar
      if (c.values.aadhaar && !el.dataset.gsDone) {
        const info = getFieldInfo(el)
        if (/aadhaa?r|aadhar|\buid\b|ஆதார்/i.test(info.combined)) {
          const group = findAadhaarInputs(el)
          if (fillAadhaar(group, c.values.aadhaar)) {
            filledTotal++
          }
          return
        }
      }

      // Skip already processed or non-empty fields
      if (el.dataset.gsDone) return
      const isEmpty = el instanceof HTMLSelectElement ? el.selectedIndex <= 0 : !(el as HTMLInputElement).value
      if (!isEmpty) return

      // 3. Priority fallback detection: id -> name -> placeholder -> label -> nearby text -> aria-label
      const info = getFieldInfo(el)
      for (const [key, re] of RULES) {
        const value = c.values[key]
        if (!value) continue

        // Test priority order
        const matched =
          re.test(info.id) ||
          re.test(info.name) ||
          re.test(info.placeholder) ||
          re.test(info.labelText) ||
          re.test(info.nearbyText) ||
          re.test(info.ariaLabel)

        if (!matched) continue

        // Prevent false positives on general name fields
        if (key === 'name' && /father|husband|guardian|mother|bank|branch|village|district|state|college|institution/i.test(info.combined)) {
          continue
        }

        if (setValue(el, value)) {
          el.dataset.gsDone = '1'
          mark(el, '#16a34a')
          filledTotal++
        }
        break
      }
    })

    // Update internal portal state for handoff
    const captchaDetected = captchaCount > 0
    w.__gsState = {
      status: captchaDetected ? 'captcha-required' : (filledTotal > 0 ? 'filled' : 'idle'),
      filledCount: filledTotal,
      captchaDetected,
    } as PortalHandoffState

    if (w.__gsDebug) {
      console.log('[GoScheme Autofill]', {
        filled: filledTotal,
        captchaDetected,
        aadhaar: maskSensitive(c.values.aadhaar),
      })
    }

    render()
  }

  // ---- Persistent GoScheme Bar with Minimization & Dismiss Support ----
  let isDismissed = false
  let isMinimized = false

  const bar = document.createElement('div')
  bar.id = 'goscheme-portal-bar'

  const collapseBar = () => {
    isMinimized = true
    render()
  }

  const expandBar = () => {
    isMinimized = false
    render()
  }

  const dismissBar = () => {
    isDismissed = true
    bar.style.display = 'none'
  }

  const render = () => {
    if (isDismissed) {
      bar.style.display = 'none'
      return
    }

    bar.innerHTML = ''

    if (isMinimized) {
      // Compact top-right pill that NEVER blocks bottom buttons
      bar.setAttribute('style', [
        'position:fixed', 'right:12px', 'top:12px', 'z-index:2147483647',
        'background:#ffffff', 'color:#15803d', 'border-radius:20px', 'padding:5px 12px',
        'box-shadow:0 4px 16px rgba(15,23,42,0.18)', 'display:flex', 'align-items:center', 'gap:8px',
        'font:600 12.5px system-ui,-apple-system,sans-serif', 'border:1.5px solid #16a34a',
        'cursor:pointer', 'transition:all 0.2s ease',
      ].join(';'))

      const pillText = document.createElement('span')
      pillText.textContent = `✓ GoScheme (${filledTotal})`
      pillText.title = 'Tap to expand GoScheme info'
      pillText.onclick = (e) => {
        e.stopPropagation()
        expandBar()
      }

      const pillClose = document.createElement('button')
      pillClose.type = 'button'
      pillClose.textContent = '✕'
      pillClose.title = 'Dismiss'
      pillClose.setAttribute('style', [
        'border:0', 'background:transparent', 'color:#94a3b8', 'font:700 13px system-ui',
        'cursor:pointer', 'padding:0 2px', 'line-height:1',
      ].join(';'))
      pillClose.onclick = (e) => {
        e.stopPropagation()
        dismissBar()
      }

      bar.append(pillText, pillClose)
    } else {
      // Full floating bar
      bar.setAttribute('style', [
        'position:fixed', 'left:12px', 'right:12px', 'bottom:12px', 'z-index:2147483647',
        'background:#ffffff', 'color:#0f172a', 'border-radius:14px', 'padding:9px 12px',
        'box-shadow:0 10px 30px rgba(15,23,42,0.22), 0 2px 6px rgba(0,112,192,0.12)',
        'display:flex', 'align-items:center', 'gap:10px',
        'font:13.5px/1.3 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        'border:2px solid #0070c0', 'transition:all 0.2s ease',
      ].join(';'))

      const dot = document.createElement('span')
      dot.setAttribute('style', [
        'flex:none', 'width:28px', 'height:28px', 'border-radius:50%',
        captchaCount > 0
          ? 'background:radial-gradient(circle at 68% 28%,#fed7aa,#f59e0b 60%,#b45309 95%);box-shadow:0 0 8px rgba(245,158,11,0.35);'
          : 'background:radial-gradient(circle at 68% 28%,#a5f3fc,#3fa9f5 35%,#0070c0 75%);',
        'display:grid', 'place-items:center', 'color:#ffffff', 'font-weight:700', 'font-size:13px',
      ].join(';'))
      dot.textContent = captchaCount > 0 ? '!' : '✓'

      const text = document.createElement('div')
      text.setAttribute('style', 'flex:1;min-width:0')

      const titleRow = document.createElement('div')
      titleRow.setAttribute('style', 'display:flex;align-items:center;gap:5px;')

      const check = document.createElement('span')
      check.setAttribute('style', 'color:#16a34a;font-weight:700;font-size:14px;')
      check.textContent = '✓'

      const b = document.createElement('b')
      b.setAttribute('style', 'font-size:13.5px;color:#0f172a;font-weight:700;')
      b.textContent = TXT.filled(filledTotal)
      titleRow.append(check, b)

      const sub = document.createElement('div')
      if (captchaCount > 0) {
        sub.setAttribute('style', 'font-size:12px;color:#d97706;font-weight:600;margin-top:2px;display:flex;align-items:center;gap:4px;')
        const alertBadge = document.createElement('span')
        alertBadge.textContent = '⚠'
        const alertMsg = document.createElement('span')
        alertMsg.textContent = TXT.captcha
        sub.append(alertBadge, alertMsg)
      } else {
        sub.setAttribute('style', 'font-size:12px;color:#475569;margin-top:2px;')
        sub.textContent = TXT.ready
      }
      text.append(titleRow, sub)

      const actionBtn = document.createElement('button')
      actionBtn.type = 'button'
      actionBtn.textContent = captchaCount > 0 ? TXT.doneCaptcha : TXT.cont
      actionBtn.setAttribute('style', [
        'flex:none', 'border:0', 'border-radius:10px',
        captchaCount > 0 ? 'background:#f59e0b;' : 'background:#0070c0;',
        'color:#ffffff', 'font:600 13px system-ui, sans-serif',
        'padding:8px 12px', 'cursor:pointer', 'box-shadow:0 2px 6px rgba(0,0,0,0.15)',
      ].join(';'))
      actionBtn.onclick = (e) => {
        e.stopPropagation()
        if (captchaCount > 0) {
          const captchaInput = document.querySelector(
            'input[id*="captcha" i], input[name*="captcha" i], input[placeholder*="captcha" i], [class*="captcha" i] input'
          ) as HTMLInputElement | null
          if (captchaInput) {
            try {
              captchaInput.focus()
              captchaInput.scrollIntoView({ behavior: 'smooth', block: 'center' })
            } catch (_) {}
          }
        }
        // Collapse to top pill so the user can easily see and press the government button
        collapseBar()
      }

      const closeBtn = document.createElement('button')
      closeBtn.type = 'button'
      closeBtn.textContent = '✕'
      closeBtn.title = 'Dismiss'
      closeBtn.setAttribute('style', [
        'flex:none', 'border:0', 'background:transparent', 'color:#94a3b8',
        'font:700 15px system-ui', 'cursor:pointer', 'padding:4px 6px', 'line-height:1',
      ].join(';'))
      closeBtn.onclick = (e) => {
        e.stopPropagation()
        dismissBar()
      }

      bar.append(dot, text, actionBtn, closeBtn)
    }

    if (!bar.isConnected && document.body) {
      document.body.appendChild(bar)
    }

    // Generous bottom scroll room so the government button can always be scrolled well above the bottom
    if (document.body) document.body.style.paddingBottom = '240px'
    if (document.documentElement) document.documentElement.style.paddingBottom = '240px'
    const content = document.querySelector('form, #MainContent, .commonboxwithshadow') as HTMLElement | null
    if (content) content.style.paddingBottom = '200px'
  }

  // Auto-collapse when user focuses on the CAPTCHA box to type
  document.addEventListener('focusin', (e) => {
    const t = e.target as HTMLElement
    if (t && isCaptchaField(t) && !isMinimized && !isDismissed) {
      collapseBar()
    }
  }, true)

  w.__gsRun = fill

  let timer: number | undefined
  // Observe DOM additions and attribute changes for dynamically rendered ASP.NET steps
  new MutationObserver((muts) => {
    const relevant = muts.some(
      (m) =>
        !bar.contains(m.target) &&
        !(m.type === 'attributes' && (m.target as Element).matches?.('input, select, textarea'))
    )
    if (!relevant) return
    clearTimeout(timer)
    timer = window.setTimeout(fill, 350)
  }).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['hidden', 'class', 'style'],
  })

  // Staggered execution for immediate + delayed dynamic content
  fill()
  setTimeout(fill, 500)
  setTimeout(fill, 1500)
}

/** The script the in-app browser runs inside the portal page. */
export function buildAutofillScript(cfg: AutofillConfig): string {
  return `(${portalAutofill.toString()})(${JSON.stringify(cfg)});`
}
