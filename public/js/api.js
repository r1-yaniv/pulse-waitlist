/** Typed-by-convention client for the waitlist API (same-origin Express, base `/api`). */

const BASE = '/api'

async function req(path, init) {
  const res = await fetch(BASE + path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init && init.headers) },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Request failed (${res.status})`)
  }
  return res.json()
}

export const getConfig = () => req('/config')

export const getCount = () => req('/count')

export const getStatus = (uid) =>
  req(`/status?uid=${encodeURIComponent(uid)}`)

/** body: { uid, email, preference, ref } */
export const join = (body) =>
  req('/join', { method: 'POST', body: JSON.stringify(body) })

/** body: { uid, preference } — updates an existing row's mailing preference. */
export const setPreference = (body) =>
  req('/preference', { method: 'POST', body: JSON.stringify(body) })
