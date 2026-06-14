/** Typed client for the waitlist API (same-origin Express server, base `/api`). */

export type Preference = 'updates' | 'launch'

export type StatusResp =
  | { joined: false }
  | { joined: true; index: number; preference: Preference }

export type JoinResp = {
  index: number
  uid: string
  preference: Preference
  merged: boolean
}

export type ConfigResp = { countRefreshMs: number }

const BASE = '/api'

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? `Request failed (${res.status})`)
  }
  return res.json() as Promise<T>
}

export const getConfig = () => req<ConfigResp>('/config')

export const getCount = () => req<{ count: number }>('/count')

export const getStatus = (uid: string) =>
  req<StatusResp>(`/status?uid=${encodeURIComponent(uid)}`)

export const join = (body: {
  uid: string
  email: string
  preference: Preference
  ref: string | null
}) => req<JoinResp>('/join', { method: 'POST', body: JSON.stringify(body) })
