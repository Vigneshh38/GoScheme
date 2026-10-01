/**
 * Status reminders. After an application is marked "Submitted", GoScheme reminds the person
 * to check its status 30 days later: a phone notification in the Android app, and a banner
 * in "My forms" everywhere (also when the notification was missed).
 */
import { Capacitor } from '@capacitor/core'

export const REMIND_AFTER_DAYS = 30

export function remindDate(from: number): number {
  return from + REMIND_AFTER_DAYS * 24 * 60 * 60 * 1000
}

/** Notification ids must be 32-bit integers; derive a stable one from the form id. */
function idFor(formId: string): number {
  let h = 0
  for (const c of formId) h = (h * 31 + c.charCodeAt(0)) | 0
  return Math.abs(h) || 1
}

export async function scheduleReminder(formId: string, at: number, title: string, body: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    const perm = await LocalNotifications.requestPermissions()
    if (perm.display !== 'granted') return
    await LocalNotifications.schedule({ notifications: [{ id: idFor(formId), title, body, schedule: { at: new Date(at), allowWhileIdle: true } }] })
  } catch {
    // The banner in "My forms" still reminds the person.
  }
}

export async function cancelReminder(formId: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    await LocalNotifications.cancel({ notifications: [{ id: idFor(formId) }] })
  } catch {
    // nothing scheduled
  }
}
