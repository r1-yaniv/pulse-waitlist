# Pulse — waitlist site

Scroll-driven hype site for the Pulse waitlist, built from `../waitlist-mockup.pen`,
with a real waitlist backend (referral ids, "you are #N" position, share modal,
live count).

## Stack

- Vite + React + TypeScript + Tailwind CSS v4 + GSAP (frontend)
- Express + `pg` API (`server/index.mjs`) on the same origin as the static site
- PostgreSQL for storage
- Deployed as a single Docker container on Railway (web service + a Postgres service)

## How it works

- Each visitor gets a persistent 8-char uid in `localStorage` (their referral token).
- `?ref=<uid>` is captured first-touch and recorded as the referrer when they join.
- Joining is deduped by email; a known email returns its original position + uid
  (the device adopts that uid). On return, the CTA shows "you are #N".
- The count line polls `GET /api/count` every `COUNT_REFRESH_MS` (default 60s).

### API

| Method | Path | Purpose |
| ------ | ---- | ------- |
| GET | `/api/config` | `{ countRefreshMs }` (runtime-tunable) |
| GET | `/api/count` | `{ count }` — live joined total |
| GET | `/api/status?uid=` | `{ joined, index?, preference? }` |
| POST | `/api/join` | `{ uid, email, preference, ref }` → `{ index, uid, preference, merged }` |

The schema (`server/init.sql`) is applied idempotently on boot (`CREATE TABLE IF NOT EXISTS`).

## Environment

| Var | Purpose |
| --- | ------- |
| `DATABASE_URL` | Postgres connection string (required) |
| `PORT` | Server port (Railway injects this; default 8080) |
| `COUNT_REFRESH_MS` | Count poll interval in ms (default 60000) |

Copy `.env.example` → `.env` for local host-mode dev.

## Run locally

The `Makefile` wraps the common flows (run `make` for the list):

```sh
make reset   # wipe db, build + start web+db in Docker, seed sample data
# open http://localhost:8080

make dev     # fast iterate: Postgres in Docker, Vite + API on the host (HMR)
make psql    # interactive psql shell
make count   # GET /api/count
make clean   # stop and WIPE the db volume (destructive)
```

`make dev` runs Vite on :5173 (proxying `/api` → :8080) and the API on :8080.

## Deploy (Railway)

Single container (`Dockerfile`) serves `dist/` + `/api`. In the Railway project:
provision a Postgres service, add `DATABASE_URL` to the web service as a reference
variable to the Postgres connection string, deploy, and generate a domain. Data lives
in the Postgres service's volume, so it survives web redeploys.

## Page flow

Trailer hero → discovery showcase → outro (slogan, EKG pulse line, giant wordmark).
A floating CTA pill ("join the waitlist") morphs into an email bar; after joining it
becomes "you are #N" and opens a share-link modal (`ShareModalCard`).
