# GoScheme

Voice-first Tamil + English app that finds the government schemes you and your family
can get, and helps you fill the application. Team **Techies** (Vignesh A, Musthaba S,
Mohammed AlHameed) — CresIgnite CSE Project Expo 2K26, PS 13.

## Run it

```bash
cd app
npm install
npm run dev          # http://localhost:5173
npm run dev:phone    # HTTPS on your Wi-Fi, so a phone can use the microphone
npm run build        # production build in app/dist (e.g. drag onto Netlify Drop)
```

Voice input needs Chrome or Edge and an internet connection.

## What's inside

- `app/` — React + Vite + TypeScript app
  - `src/data/schemes.ts` — the 10 schemes and their eligibility rules
  - `src/data/scheme-details.json` — official details, steps, documents and form links
    (`npm run schemes:extract`, from myScheme and each scheme's official site)
  - `public/voice/` — recorded questions (Azure neural voices Pallavi / Neerja)
- `tools/tts/` — script that records the spoken questions (`generate.py`)
- `mockups/` — UI mockups and diagrams used in the expo deck
- `GoScheme_Expo.pptx`, `GoScheme_Techies_PS13.pdf` — expo presentation

GoScheme is not an official government app. Eligibility rules are simplified for the demo;
always check the official website before applying.
