/**
 * Opens an official portal and fills it.
 * - Android app: the portal opens inside GoScheme's in-app browser, and the fill script runs
 *   after every page load and URL change (portals move through several pages / steps).
 * - Web: a normal website is not allowed to type into another website, so the portal opens
 *   in a new tab and the caller shows the values to copy.
 */
import { Capacitor } from '@capacitor/core'
import { buildAutofillScript, type AutofillConfig } from './autofill'

export const canAutofill = Capacitor.isNativePlatform()

export async function openPortal(url: string, title: string, cfg: AutofillConfig): Promise<'filled-in-app' | 'opened-tab'> {
  if (!canAutofill) {
    window.open(url, '_blank', 'noopener')
    return 'opened-tab'
  }
  const { InAppBrowser, ToolBarType } = await import('@capgo/inappbrowser')
  const script = buildAutofillScript(cfg)
  await InAppBrowser.removeAllListeners()
  const inject = (id?: string) => InAppBrowser.executeScript({ code: script, id }).catch(() => {})
  await InAppBrowser.addListener('browserPageLoaded', (e) => { inject(e.id) })
  await InAppBrowser.addListener('urlChangeEvent', (e) => { setTimeout(() => inject(e.id), 900) })
  await InAppBrowser.addListener('closeEvent', () => { InAppBrowser.removeAllListeners() })
  await InAppBrowser.openWebView({
    url,
    title,
    toolbarType: ToolBarType.NAVIGATION,
    toolbarColor: '#0070C0',
    // Some government sites show a blank page to Android's embedded browser ("; wv" in the
    // user agent). Present as normal mobile Chrome instead.
    headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36' },
    showReloadButton: true,
    isPresentAfterPageLoad: false,
  })
  return 'filled-in-app'
}
