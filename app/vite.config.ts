import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// `npm run dev:phone` serves over HTTPS on the local network, because phones only
// allow microphone access (speech recognition) on secure origins.
// `--mode artifact` (npm run build:artifact) builds a single self-contained page for a
// Claude Artifact: relative paths, one JS bundle, fonts from Google Fonts.
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'phone' ? [basicSsl()] : [])],
  ...(mode === 'artifact' && {
    base: './',
    resolve: { alias: [{ find: /^\.\/fonts$/, replacement: fileURLToPath(new URL('./src/fonts-none.ts', import.meta.url)) }] },
    build: { outDir: 'dist-artifact', emptyOutDir: true, rollupOptions: { output: { inlineDynamicImports: true } } },
  }),
}))
