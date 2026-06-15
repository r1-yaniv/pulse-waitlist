import { useCallback, useEffect, useRef, useState } from 'react'
import { captureRef, getOrCreateUid, getStoredRef, setUid } from './identity'
import * as api from './waitlist'
import type { JoinResp, Preference, StatusResp } from './waitlist'

/**
 * Single source of truth for the waitlist UI. App owns one instance and shares
 * it with both the CTA (form / "you are #N" pill) and the share modal, so they
 * always agree on the visitor's uid, position, and the live count.
 */
export type Waitlist = {
  /** Persistent visitor uid (also the share/referral token). */
  uid: string
  /** null = still loading; otherwise joined/not-joined. */
  status: StatusResp | null
  /** null = unknown (loading/error); otherwise the live joined count. */
  count: number | null
  /** Join (or merge by email). Throws on failure for the caller to surface. */
  join: (email: string, preference: Preference) => Promise<JoinResp>
}

export function useWaitlist(): Waitlist {
  const [uid, setUidState] = useState<string>('')
  const [status, setStatus] = useState<StatusResp | null>(null)
  const [count, setCount] = useState<number | null>(null)
  const uidRef = useRef('')

  useEffect(() => {
    const id = getOrCreateUid()
    uidRef.current = id
    setUidState(id)
    captureRef()

    let cancelled = false
    const refreshCount = () =>
      api
        .getCount()
        .then((r) => { if (!cancelled) setCount(r.count) })
        .catch(() => { /* keep last known value */ })

    api
      .getStatus(id)
      .then((s) => { if (!cancelled) setStatus(s) })
      .catch(() => { if (!cancelled) setStatus({ joined: false }) })

    refreshCount()

    // Poll the count on the server-configured interval, but never while the tab
    // is backgrounded; refetch once immediately when it becomes visible again.
    let timer: ReturnType<typeof setInterval> | undefined
    const start = (ms: number) => {
      stop()
      timer = setInterval(() => {
        if (document.visibilityState === 'visible') void refreshCount()
      }, ms)
    }
    const stop = () => { if (timer) clearInterval(timer); timer = undefined }
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refreshCount()
    }

    api
      .getConfig()
      .then((c) => { if (!cancelled) start(c.countRefreshMs || 60_000) })
      .catch(() => { if (!cancelled) start(60_000) })

    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      stop()
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  const join = useCallback(
    async (email: string, preference: Preference): Promise<JoinResp> => {
      const res = await api.join({
        uid: uidRef.current,
        email,
        preference,
        ref: getStoredRef(),
      })
      // An email already on the list returns its original uid — adopt it so this
      // device is recognized on future loads.
      if (res.merged && res.uid !== uidRef.current) {
        uidRef.current = res.uid
        setUid(res.uid)
        setUidState(res.uid)
      }
      setStatus({ joined: true, index: res.index, preference: res.preference })
      // A brand-new row grows the count; a merge doesn't.
      if (!res.merged) setCount((c) => (c == null ? c : c + 1))
      return res
    },
    [],
  )

  return { uid, status, count, join }
}
