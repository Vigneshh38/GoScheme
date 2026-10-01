/**
 * Reads numbers from a document photo with Tesseract (runs on the device, fully offline: the
 * engine and English data ship with the app). The photo is only held in memory while reading and
 * is never stored. Aadhaar and account numbers are masked before they leave this module.
 */
import type { DocId } from '../data/schemes'
import { setSecret } from './secrets'

const mask = (digits: string) => 'X'.repeat(Math.min(6, Math.max(0, digits.length - 4))) + digits.slice(-4)

/** Field values found in the recognised text, keyed by form field id. */
export function extractFields(doc: DocId, raw: string): Record<string, string> {
  const text = raw.toUpperCase()
  const out: Record<string, string> = {}
  if (doc === 'aadhaar') {
    const m = text.match(/\b(\d{4})\s?(\d{4})\s?(\d{4})\b/)
    if (m) {
      out.aadhaar = `XXXX XXXX ${m[3]}`
      setSecret('aadhaar', m[1] + m[2] + m[3]) // full number: memory only, for the official portal
    }
  }
  if (doc === 'bank') {
    // OCR often reads the fifth IFSC character (always zero) as the letter O.
    const ifsc = text.match(/\b([A-Z]{4})[0O]([A-Z0-9]{6})\b/)
    if (ifsc) out.ifsc = `${ifsc[1]}0${ifsc[2]}`
    const runs = (text.match(/\d[\d ]{7,22}\d/g) ?? []).map((r) => r.replace(/ /g, '')).filter((r) => r.length >= 9 && r.length <= 18)
    const account = runs.sort((a, b) => b.length - a.length)[0]
    if (account) {
      out.bankAccount = mask(account)
      setSecret('bankAccount', account)
    }
  }
  if (doc === 'land') {
    const m = text.match(/\b(\d{1,4})\s?\/\s?(\d{1,3}[A-Z]?)\b/)
    if (m) out.surveyNo = `${m[1]}/${m[2]}`
  }
  if (doc === 'ration') {
    const m = text.match(/\b\d{10,12}\b/)
    if (m) out.rationCard = mask(m[0])
  }
  return out
}

export async function readDocument(photo: Blob, doc: DocId, onProgress: (p: number) => void): Promise<Record<string, string>> {
  const { createWorker } = await import('tesseract.js')
  // Engine and English data are bundled in public/tesseract (scripts/copy-ocr-assets.mjs),
  // so scanning works without internet.
  const base = `${import.meta.env.BASE_URL}tesseract/`
  const worker = await createWorker('eng', 1, {
    workerPath: `${base}worker.min.js`,
    corePath: base,
    langPath: base,
    workerBlobURL: false,
    logger: (m: { status: string; progress: number }) => {
      if (m.status === 'recognizing text') onProgress(m.progress)
    },
  })
  try {
    const { data } = await worker.recognize(photo)
    return extractFields(doc, data.text)
  } finally {
    await worker.terminate()
  }
}
