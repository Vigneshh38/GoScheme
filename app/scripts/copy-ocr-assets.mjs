// Copies the Tesseract engine and English data into public/tesseract so document scanning
// works offline (otherwise tesseract.js downloads them from a CDN on first use).
// Runs before every build; public/tesseract is not committed.
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'

const out = 'public/tesseract'
mkdirSync(out, { recursive: true })
const files = [
  ['node_modules/tesseract.js/dist/worker.min.js', 'worker.min.js'],
  ['node_modules/tesseract.js-core/tesseract-core-lstm.wasm.js', 'tesseract-core-lstm.wasm.js'],
  ['node_modules/tesseract.js-core/tesseract-core-simd-lstm.wasm.js', 'tesseract-core-simd-lstm.wasm.js'],
  ['node_modules/tesseract.js-core/tesseract-core-relaxedsimd-lstm.wasm.js', 'tesseract-core-relaxedsimd-lstm.wasm.js'],
  ['node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz', 'eng.traineddata.gz'],
]
for (const [from, to] of files) {
  if (!existsSync(from)) throw new Error(`missing ${from} — run npm install`)
  copyFileSync(from, `${out}/${to}`)
}
console.log(`copied ${files.length} OCR files to ${out}`)
