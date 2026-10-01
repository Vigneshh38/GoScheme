/**
 * Fills an official government portal with the user's answers. The function below is
 * serialised with `toString()` and run *inside the portal page* by the Android in-app
 * browser, so it must stay self-contained (no imports, no outer variables).
 *
 * - Known fields are filled by exact selector; later steps (which only appear after the
 *   Aadhaar OTP) are matched by their label, id, name or placeholder.
 * - Captcha and OTP boxes are never filled: they are highlighted for the person to type.
 * - A small GoScheme bar at the bottom shows progress. Its "Continue" button presses the
 *   portal's own Get OTP / Submit button. Once the person has typed every captcha / OTP /
 *   password, it presses that button by itself after a short countdown (tap "Stop" to cancel).
 * - A MutationObserver re-runs the fill when the portal shows its next step.
 */

import type { Lang } from '../types'
import { say } from '../lang'

export type FillKey =
  | 'aadhaar' | 'mobile' | 'name' | 'fatherName' | 'gender' | 'state' | 'district' | 'village'
  | 'pincode' | 'ifsc' | 'bankAccount' | 'surveyNo' | 'umisId' | 'college'

export type FillValues = Partial<Record<FillKey, string>>

/** `choose` ticks a radio/checkbox; `key` fills from the values. */
export type ExactField = { selector: string; key?: FillKey; choose?: true }

/** The GoScheme bar's sentences, in the person's language ({n}, {label}, {s} are filled in). */
export type BarText = {
  filled: string; filledOne: string; captcha: string; ready: string; cont: string
  needCaptcha: string; noButton: string; auto: string; stop: string
}

export type AutofillConfig = {
  values: FillValues
  exact: ExactField[]
  text: BarText
}

export function barText(lang: Lang): BarText {
  return {
    filled: say(lang, 'GoScheme filled {n} fields', 'GoScheme {n} விவரங்களை நிரப்பியது'),
    filledOne: say(lang, 'GoScheme filled 1 field', 'GoScheme 1 விவரத்தை நிரப்பியது'),
    captcha: say(lang, 'Type the password / captcha / OTP in the orange boxes yourself', 'ஆரஞ்சு பெட்டிகளில் கடவுச்சொல் / கேப்ட்சா / OTP-ஐ நீங்களே உள்ளிடவும்'),
    ready: say(lang, 'Check the details, then tap Continue', 'சரிபார்த்துவிட்டு "தொடர்" அழுத்தவும்'),
    cont: say(lang, 'Continue', 'தொடர்'),
    needCaptcha: say(lang, 'Fill the orange boxes first', 'முதலில் ஆரஞ்சு பெட்டிகளை நிரப்பவும்'),
    noButton: say(lang, "Couldn't find the next button — tap the website's own button", 'இந்தப் பக்கத்தில் தொடர் பொத்தான் இல்லை — இணையதளத்தின் பொத்தானை அழுத்தவும்'),
    auto: say(lang, 'Pressing "{label}" in {s}…', '{s} நொடியில் "{label}" தானாக அழுத்தப்படும்'),
    stop: say(lang, 'Stop', 'நிறுத்து'),
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
    auto: (label: string, sec: number) => T.auto.split('{label}').join(label).split('{s}').join(String(sec)),
    stop: T.stop,
  }

  // Order matters: more specific labels first (father's name before name, IFSC before account).
  const RULES: [FillKey, RegExp][] = [
    ['umisId', /umis|emis|user.?name|login.?id/i],
    ['aadhaar', /aadhaa?r|aadhar|\buid\b|ஆதார்/i],
    ['mobile', /mobile|phone|contact.?no|கைபேசி|மொபைல்/i],
    ['ifsc', /ifsc/i],
    ['bankAccount', /(account|a\/c|acc)\s*(no|number|num)|bank.?account|கணக்கு\s*எண்/i],
    ['fatherName', /father|husband|guardian|spouse|தந்தை|கணவர்/i],
    ['surveyNo', /survey|khasra|khata|patta|புல\s*எண்/i],
    ['pincode', /pin\s*code|pincode|postal|அஞ்சல்/i],
    ['village', /village|கிராம/i],
    ['district', /district|மாவட்ட/i],
    ['state', /\bstate\b|மாநில/i],
    ['gender', /gender|\bsex\b|பாலின/i],
    ['college', /college|institution|கல்லூரி/i],
    ['name', /(farmer|applicant|beneficiary|full|worker)?\s*name|பெயர்/i],
  ]
  const SKIP = /captcha|otp|security.?code|verification.?code/i
  // Captcha, OTP and passwords are always typed by the person.
  const personTypes = (el: HTMLElement) => (el as HTMLInputElement).type === 'password' || SKIP.test(labelOf(el))

  const visible = (el: Element) => {
    const r = (el as HTMLElement).getBoundingClientRect()
    return r.width > 0 && r.height > 0 && getComputedStyle(el as HTMLElement).visibility !== 'hidden'
  }

  const labelOf = (el: HTMLElement): string => {
    const parts: string[] = []
    const id = el.id
    if (id) {
      const l = document.querySelector(`label[for="${CSS.escape(id)}"]`)
      if (l) parts.push(l.textContent || '')
    }
    parts.push(el.getAttribute('aria-label') || '', el.getAttribute('placeholder') || '', el.getAttribute('formcontrolname') || '')
    parts.push((el as HTMLInputElement).name || '', id || '')
    const wrapLabel = el.closest('label')
    if (wrapLabel) parts.push(wrapLabel.textContent || '')
    const cell = el.closest('td')
    if (cell?.previousElementSibling) parts.push(cell.previousElementSibling.textContent || '')
    const prev = el.previousElementSibling || el.parentElement?.previousElementSibling
    if (prev) parts.push(prev.textContent || '')
    return parts.join(' ').replace(/\s+/g, ' ').slice(0, 200)
  }

  const mark = (el: HTMLElement, color: string) => {
    el.style.outline = `3px solid ${color}`
    el.style.outlineOffset = '1px'
  }

  const setValue = (el: HTMLElement, value: string): boolean => {
    if (el instanceof HTMLSelectElement) {
      const want = value.trim().toLowerCase()
      const opts = Array.from(el.options)
      const opt =
        opts.find((o) => o.value.toLowerCase() === want || o.text.trim().toLowerCase() === want) ||
        opts.find((o) => o.index > 0 && o.text.trim().toLowerCase().includes(want))
      if (!opt) return false
      el.value = opt.value
    } else if (el instanceof HTMLInputElement && (el.type === 'radio' || el.type === 'checkbox')) {
      if (!el.checked) el.click()
      return true
    } else {
      const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
      const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
      setter ? setter.call(el, value) : ((el as HTMLInputElement).value = value)
    }
    for (const type of ['input', 'change', 'blur']) el.dispatchEvent(new Event(type, { bubbles: true }))
    return true
  }

  const isEmpty = (el: HTMLElement) =>
    el instanceof HTMLSelectElement ? el.selectedIndex <= 0 : !(el as HTMLInputElement).value

  let filledTotal = 0
  let captchaCount = 0

  const fill = () => {
    const c = w.__gsConfig as AutofillConfig
    // 1. Exact fields for this portal
    for (const f of c.exact) {
      const el = document.querySelector(f.selector) as HTMLElement | null
      if (!el || el.dataset.gsDone || !visible(el)) continue
      const value = f.choose ? 'x' : f.key ? c.values[f.key] : undefined
      if (value && setValue(el, value)) {
        el.dataset.gsDone = '1'
        mark(el, '#16a34a')
        filledTotal++
      }
    }
    // 2. Any other empty field whose label we recognise
    captchaCount = 0
    const fields = document.querySelectorAll('input:not([type=hidden]):not([type=radio]):not([type=checkbox]):not([type=submit]):not([type=button]):not([type=image]), select, textarea')
    fields.forEach((node) => {
      const el = node as HTMLElement
      if (!visible(el) || (el as HTMLInputElement).disabled || (el as HTMLInputElement).readOnly) return
      const label = labelOf(el)
      if (personTypes(el)) {
        mark(el, '#f59e0b')
        captchaCount++
        return
      }
      if (el.dataset.gsDone || !isEmpty(el)) return
      for (const [key, re] of RULES) {
        const value = c.values[key]
        if (!value || !re.test(label)) continue
        if (key === 'name' && /father|husband|guardian|mother|bank|branch|village|district|state|user|college|institution|school/i.test(label)) continue
        if (setValue(el, value)) {
          el.dataset.gsDone = '1'
          mark(el, '#16a34a')
          filledTotal++
        }
        break
      }
    })
    render()
  }

  // ---- bottom bar ----
  const bar = document.createElement('div')
  bar.setAttribute('style', [
    'position:fixed', 'left:10px', 'right:10px', 'bottom:10px', 'z-index:2147483647',
    'background:#fff', 'color:#0f172a', 'border-radius:16px', 'padding:10px 12px',
    'box-shadow:0 10px 30px rgba(15,23,42,.25)', 'display:flex', 'align-items:center', 'gap:10px',
    'font:14px/1.35 system-ui,sans-serif', 'border:2px solid #0070c0',
  ].join(';'))
  const dot = document.createElement('span')
  dot.setAttribute('style', 'flex:none;width:30px;height:30px;border-radius:50%;background:radial-gradient(circle at 68% 28%,#a5f3fc,#3fa9f5 35%,#0070c0 75%)')
  const text = document.createElement('div')
  text.setAttribute('style', 'flex:1;min-width:0')
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.setAttribute('style', 'flex:none;border:0;border-radius:12px;background:#0070c0;color:#fff;font:600 14px system-ui,sans-serif;padding:10px 14px')
  bar.append(dot, text, btn)

  const render = () => {
    // A re-fill while counting down must not wipe the countdown.
    if (countdown !== undefined) return
    btn.textContent = TXT.cont
    text.innerHTML = ''
    const b = document.createElement('b')
    b.textContent = TXT.filled(filledTotal)
    const s = document.createElement('div')
    s.setAttribute('style', 'font-size:12.5px;color:#475569')
    s.textContent = captchaCount > 0 ? TXT.captcha : TXT.ready
    text.append(b, s)
    if (!bar.isConnected && document.body) {
      document.body.appendChild(bar)
      // Room under the page so the bar never hides the portal's own captcha or button.
      document.body.style.paddingBottom = '110px'
    }
  }

  const flash = (msg: string) => {
    const s = text.lastElementChild as HTMLElement | null
    if (s) {
      s.textContent = msg
      s.style.color = '#b91c1c'
    }
  }

  const personFields = () =>
    Array.from(document.querySelectorAll('input')).filter((i) => visible(i) && !i.disabled && !i.readOnly && personTypes(i))

  // Looks complete: the portal's own length if it sets one (OTP boxes usually do), else 4+.
  const complete = (i: HTMLInputElement) => (i.maxLength > 0 && i.maxLength <= 8 ? i.value.length >= i.maxLength : i.value.length >= 4)

  const nextButton = (): HTMLElement | undefined => {
    const candidates = Array.from(document.querySelectorAll('button, input[type=submit], input[type=button], a.btn')).filter((b) => {
      if (!visible(b) || bar.contains(b) || (b as HTMLButtonElement).disabled) return false
      const t = ((b as HTMLInputElement).value || b.textContent || '').trim()
      return /get otp|send otp|verify|submit|save|next|continue|proceed|register|log\s?in|sign\s?in|apply|சமர்ப்பி/i.test(t) && !/refresh|reset|cancel|back|close|clear|captcha/i.test(t)
    })
    return candidates[0] as HTMLElement | undefined
  }

  const cont = () => {
    stopCountdown()
    // Captcha / OTP must be typed by the person before we move on.
    const pending = personFields().filter((i) => !i.value)
    if (pending.length) {
      pending[0].focus()
      flash(TXT.needCaptcha)
      return
    }
    const next = nextButton()
    if (!next) return flash(TXT.noButton)
    next.click()
  }

  // Auto-press: once the person has filled every orange box, wait 2.5 s after the last key
  // (they may still be typing), count down on the bar, then press the portal's button.
  // Tapping "Stop" cancels. Pages without orange boxes wait for the person's own tap.
  let countdown: number | undefined
  let typing: number | undefined
  const stopCountdown = () => {
    clearTimeout(typing)
    clearInterval(countdown)
    countdown = undefined
    render()
  }
  const startCountdown = () => {
    const next = nextButton()
    if (!next) return
    const label = ((next as HTMLInputElement).value || next.textContent || '').trim().slice(0, 24)
    let left = 3
    const tick = () => {
      if (left === 0) return cont()
      const s = text.lastElementChild as HTMLElement | null
      if (s) { s.textContent = TXT.auto(label, left); s.style.color = '#0070c0' }
      btn.textContent = TXT.stop
      left--
    }
    tick()
    countdown = window.setInterval(tick, 1000)
  }
  document.addEventListener('input', (e) => {
    const el = e.target as HTMLInputElement
    if (!(el instanceof HTMLInputElement) || !personTypes(el)) return
    stopCountdown()
    const fields = personFields()
    if (fields.length && fields.every(complete)) typing = window.setTimeout(startCountdown, 2500)
  }, true)

  btn.addEventListener('click', () => (countdown !== undefined ? stopCountdown() : cont()))

  w.__gsRun = fill
  let timer: number | undefined
  // Portals show their next step by adding elements or by un-hiding them (hidden / class /
  // style). Style changes on form fields are ignored: our own green / orange outlines are those.
  new MutationObserver((muts) => {
    const relevant = muts.some((m) =>
      !bar.contains(m.target) &&
      !(m.type === 'attributes' && (m.target as Element).matches?.('input, select, textarea')))
    if (!relevant) return
    clearTimeout(timer)
    timer = window.setTimeout(fill, 450)
  }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'class', 'style'] })
  fill()
  setTimeout(fill, 1200)
}

/** The script the in-app browser runs inside the portal page. */
export function buildAutofillScript(cfg: AutofillConfig): string {
  return `(${portalAutofill.toString()})(${JSON.stringify(cfg)});`
}
