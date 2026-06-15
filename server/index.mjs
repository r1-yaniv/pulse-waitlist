import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import pg from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIST_DIR = join(__dirname, '..', 'dist')

const PORT = Number(process.env.PORT) || 8080
const COUNT_REFRESH_MS = Number.parseInt(process.env.COUNT_REFRESH_MS, 10) || 60_000

const UID_RE = /^[A-Za-z0-9]{8}$/
// Pragmatic email check — exact RFC validation isn't the point; the unique
// constraint and normalization do the real work.
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

/** Server-side uid generation, used only to recover from the (astronomically
 *  rare) case where a client's random uid collides with an existing row. */
function randomUid() {
  let s = ''
  for (let i = 0; i < 8; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  return s
}

async function migrate() {
  const sql = await readFile(join(__dirname, 'init.sql'), 'utf8')
  await pool.query(sql)
}

const app = express()
app.use(express.json())

app.get('/api/config', (_req, res) => {
  res.json({ countRefreshMs: COUNT_REFRESH_MS })
})

app.get('/api/count', async (_req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM waitlist')
    res.json({ count: rows[0].count })
  } catch (err) {
    next(err)
  }
})

app.get('/api/status', async (req, res, next) => {
  const uid = String(req.query.uid ?? '')
  if (!UID_RE.test(uid)) return res.status(400).json({ error: 'invalid uid' })
  try {
    const { rows } = await pool.query(
      'SELECT idx, preference FROM waitlist WHERE uid = $1',
      [uid],
    )
    if (rows.length === 0) return res.json({ joined: false })
    // pg returns BIGINT as a string; positions stay well within Number range.
    res.json({ joined: true, index: Number(rows[0].idx), preference: rows[0].preference })
  } catch (err) {
    next(err)
  }
})

app.post('/api/join', async (req, res, next) => {
  const body = req.body ?? {}
  const uid = String(body.uid ?? '')
  if (!UID_RE.test(uid)) return res.status(400).json({ error: 'invalid uid' })

  const email = String(body.email ?? '').trim().toLowerCase()
  if (email.length === 0 || email.length > 254 || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'invalid email' })
  }

  const preference = body.preference === 'updates' ? 'updates' : 'launch'

  // Only keep a valid referrer that isn't the visitor themselves.
  const rawRef = String(body.ref ?? '')
  const ref = UID_RE.test(rawRef) && rawRef !== uid ? rawRef : null

  // INSERT ... ON CONFLICT (email) returns the existing row on a repeat email
  // (first registration wins); (xmax = 0) discriminates fresh insert vs conflict.
  const sql = `
    INSERT INTO waitlist (uid, email, referrer_uid, preference)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (email) DO UPDATE SET email = waitlist.email
    RETURNING idx, uid, preference, (xmax = 0) AS inserted
  `

  let attemptUid = uid
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { rows } = await pool.query(sql, [attemptUid, email, ref, preference])
      const row = rows[0]
      return res.json({
        index: Number(row.idx),
        uid: row.uid,
        preference: row.preference,
        merged: !row.inserted,
      })
    } catch (err) {
      // 23505 on the uid unique constraint => this random uid is taken by a
      // different email. Regenerate server-side and retry (email conflicts are
      // already absorbed by ON CONFLICT and never reach here).
      if (err && err.code === '23505' && /uid/.test(err.constraint ?? '')) {
        attemptUid = randomUid()
        continue
      }
      return next(err)
    }
  }
  return res.status(500).json({ error: 'could not allocate a unique id, please retry' })
})

// Static frontend + SPA fallback (everything that isn't /api/*).
app.use(express.static(DIST_DIR))
app.get(/^(?!\/api\/).*/, (_req, res) => {
  res.sendFile(join(DIST_DIR, 'index.html'))
})

// eslint-disable-next-line no-unused-vars -- Express needs the 4-arg signature.
app.use((err, _req, res, _next) => {
  console.error('[waitlist] request error:', err)
  res.status(500).json({ error: 'internal error' })
})

migrate()
  .then(() => {
    app.listen(PORT, () => console.log(`[waitlist] listening on :${PORT}`))
  })
  .catch((err) => {
    console.error('[waitlist] migration failed, not starting:', err)
    process.exit(1)
  })
