/**
 * Per-visitor identity + referral capture.
 *
 * The uid is the visitor's own referral token. It lives in localStorage so it
 * survives tab refresh, tab close+reopen, browser restart, and PC restart. If
 * localStorage is unavailable (private mode / blocked), we fall back to an
 * in-memory uid so the app still works for the session — it just won't persist.
 */

const UID_KEY = 'pulse.wl.uid'
const REF_KEY = 'pulse.wl.ref'
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
const UID_RE = /^[A-Za-z0-9]{8}$/

let memoryUid: string | null = null

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* storage blocked — caller keeps an in-memory copy where it matters */
  }
}

/** 8-char alphanumeric id from a uniform random source. */
function randomUid(): string {
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  let s = ''
  for (let i = 0; i < 8; i++) s += ALPHABET[bytes[i] % ALPHABET.length]
  return s
}

/** Read the persisted uid, creating and storing one on first visit. */
export function getOrCreateUid(): string {
  const stored = safeGet(UID_KEY)
  if (stored && UID_RE.test(stored)) return stored

  const uid = memoryUid ?? randomUid()
  memoryUid = uid
  safeSet(UID_KEY, uid)
  return uid
}

/** Overwrite the stored uid — used after an email-merge adopts the original. */
export function setUid(uid: string): void {
  memoryUid = uid
  safeSet(UID_KEY, uid)
}

/**
 * First-touch referral capture: read `?ref=` from the URL and persist it the
 * first time only, so the original referrer keeps the credit on later visits.
 * Returns the stored referrer (if any).
 */
export function captureRef(): string | null {
  const fromUrl = new URLSearchParams(window.location.search).get('ref')
  if (fromUrl && UID_RE.test(fromUrl) && !safeGet(REF_KEY)) {
    safeSet(REF_KEY, fromUrl)
  }
  return getStoredRef()
}

export function getStoredRef(): string | null {
  return safeGet(REF_KEY)
}
