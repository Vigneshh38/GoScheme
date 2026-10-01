/**
 * Full Aadhaar and bank account numbers, kept in memory only for the current session.
 * Portals need the full numbers, but the app never saves them: storage keeps only the
 * masked form (last 4 digits). Closing the app forgets these.
 */
type SecretKey = 'aadhaar' | 'bankAccount'

const secrets = new Map<SecretKey, string>()

export function setSecret(key: SecretKey, value: string): void {
  secrets.set(key, value.replace(/\s/g, ''))
}

export function getSecret(key: SecretKey): string | undefined {
  return secrets.get(key)
}

export function clearSecrets(): void {
  secrets.clear()
}
