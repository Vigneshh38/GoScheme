/**
 * Saves the app state encrypted on this device only.
 * An AES-GCM key is created once and kept in IndexedDB as a non-extractable key, so the
 * raw key can never be read out by page scripts; the encrypted state lives in localStorage.
 * Web Crypto only exists on secure origins (https or localhost). Elsewhere nothing is saved.
 */
import type { AppState } from '../types'

const DATA_KEY = 'goscheme.v1'
const DB = 'goscheme'
const STORE = 'keys'

export const canPersist = typeof crypto !== 'undefined' && !!crypto.subtle && typeof indexedDB !== 'undefined'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function idb<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const req = fn(db.transaction(STORE, mode).objectStore(STORE))
        req.onsuccess = () => resolve(req.result as T)
        req.onerror = () => reject(req.error)
      }),
  )
}

let keyPromise: Promise<CryptoKey> | null = null

function getKey(): Promise<CryptoKey> {
  keyPromise ??= (async () => {
    const existing = await idb<CryptoKey | undefined>('readonly', (s) => s.get('state'))
    if (existing) return existing
    const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
    await idb('readwrite', (s) => s.put(key, 'state'))
    return key
  })()
  return keyPromise
}

function b64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buf)
  let s = ''
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(s)
}
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))

export async function loadState(): Promise<AppState | null> {
  if (!canPersist) return null
  try {
    const raw = localStorage.getItem(DATA_KEY)
    if (!raw) return null
    const [iv, data] = raw.split('.')
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, await getKey(), unb64(data))
    return JSON.parse(new TextDecoder().decode(plain)) as AppState
  } catch {
    return null
  }
}

export async function saveState(state: AppState): Promise<void> {
  if (!canPersist) return
  try {
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await getKey(), new TextEncoder().encode(JSON.stringify(state)))
    localStorage.setItem(DATA_KEY, `${b64(iv)}.${b64(data)}`)
  } catch {
    // Storage full or blocked: the app keeps working for this session.
  }
}

export async function wipeState(): Promise<void> {
  try {
    localStorage.removeItem(DATA_KEY)
    keyPromise = null
    await new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase(DB)
      req.onsuccess = req.onerror = req.onblocked = () => resolve()
    })
  } catch {
    // nothing stored
  }
}
