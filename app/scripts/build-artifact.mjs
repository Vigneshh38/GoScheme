// Builds GoScheme as a Claude Artifact: one self-contained page (CSS + JS inlined,
// fonts from Google Fonts) plus the recorded voice clips next to it.
//
//   npm run build:artifact   → dist-artifact/index.html + dist-artifact/voice/*
import { execSync } from 'node:child_process'
import { readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

execSync('npx vite build --mode artifact', { stdio: 'inherit' })

const OUT = 'dist-artifact'
const html = readFileSync(join(OUT, 'index.html'), 'utf8')
const assets = readdirSync(join(OUT, 'assets'))
const js = assets.filter((f) => f.endsWith('.js'))
const css = assets.filter((f) => f.endsWith('.css'))
if (js.length !== 1) throw new Error(`expected one JS bundle, found ${js.join(', ')}`)

const read = (f) => readFileSync(join(OUT, 'assets', f), 'utf8')
// A literal "</script" inside the bundle would end the inline script early.
const script = read(js[0]).replace(/<\/script/gi, '<\\/script')
const styles = css.map(read).join('\n')

const title = html.match(/<title>(.*?)<\/title>/)?.[1] ?? 'GoScheme'
const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? ''

// The Artifact host adds <!doctype>, <html>, <head> and <body>; we provide the content.
const page = `<title>${title}</title>
<meta name="description" content="${description}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;500;600;700&family=Noto+Sans+Telugu:wght@400;600&family=Noto+Sans+Kannada:wght@400;600&family=Poppins:wght@400;500;600;700&display=swap">
<style>
${styles}
/* Artifact frame: fill the viewer, keep the app's white page */
html, body { height: 100%; background: #fff; }
</style>
<div id="root"></div>
<script type="module">
${script}
</script>
`

writeFileSync(join(OUT, 'index.html'), page)
rmSync(join(OUT, 'assets'), { recursive: true })
for (const f of ['icon.svg', 'manifest.webmanifest']) rmSync(join(OUT, f), { force: true })
// Offline OCR files are for the Android app; the Artifact frame scans with demo values instead.
rmSync(join(OUT, 'tesseract'), { recursive: true, force: true })
console.log(`artifact page: ${(page.length / 1024).toFixed(0)} KB, voice clips: ${readdirSync(join(OUT, 'voice', 'ta')).length + readdirSync(join(OUT, 'voice', 'en')).length}`)
