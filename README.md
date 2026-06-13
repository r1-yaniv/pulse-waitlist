# Pulse — waitlist site

Scroll-driven hype site for the Pulse waitlist, built from `../waitlist-mockup.pen`.

## Stack

- Vite + React + TypeScript
- Tailwind CSS v4 (design tokens from the mockup's variables, in `src/index.css`)
- GSAP ScrollTrigger for the depth/scroll effects
- Express API (`server/index.mjs`) — stores waitlist emails in `server/data/waitlist.json`

## Run

```sh
npm install
npm run dev      # vite on :5173, API on :8787 (proxied at /api)
```

## Production

```sh
npm run build
npm start        # serves dist + API on :8787
```

## Page flow

Hero → Descend (ridge) → Intro (scroll-highlighted paragraphs) → 3 feature
showcases (alternating sides) → dunes separator → Outro (slogan, waitlist
form with post-join state, EKG pulse line, giant wordmark).
