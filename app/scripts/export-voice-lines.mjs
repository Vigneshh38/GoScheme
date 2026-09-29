// Writes every spoken line (tools/tts/lines.json) for the voice generator.
// Usage: npm run voice:lines
import { createHash } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
try {
  const { voiceLines } = await server.ssrLoadModule('/src/data/voiceLines.ts')
  const lines = voiceLines().map((l) => ({
    ...l,
    // Same id the app computes to find the recording.
    id: createHash('sha1').update(`${l.lang}|${l.text}`).digest('hex').slice(0, 12),
  }))
  mkdirSync('../tools/tts', { recursive: true })
  writeFileSync('../tools/tts/lines.json', JSON.stringify(lines, null, 2) + '\n')
  console.log(`wrote ${lines.length} lines to tools/tts/lines.json`)
} finally {
  await server.close()
}
