import OpenReplay from '@openreplay/tracker'
import { getOrCreateUid } from './identity'

// OpenReplay session replay. The project key is a public, client-side
// identifier (it ships in the browser bundle by design), so it lives in source.
// ingestPoint is omitted — it defaults to OpenReplay Cloud.
const PROJECT_KEY = 'csyBy6nxAxZObpNlcR18'

let tracker: OpenReplay | null = null

/**
 * Start OpenReplay, identifying the session by the visitor's persistent uid
 * (anonymous — no email/PII is ever sent). Idempotent; failures never bubble up
 * to the page. Only called in production (see main.tsx).
 */
export function initOpenReplay() {
  if (tracker) return
  tracker = new OpenReplay({ projectKey: PROJECT_KEY })
  void tracker.start({ userID: getOrCreateUid() }).catch(() => {
    /* analytics is best-effort — don't let it break the site */
  })
}

/**
 * Enrich the current session with waitlist context. No-op when the tracker
 * isn't running (e.g. local dev). Metadata keys (`waitlist_index`, `preference`,
 * `referrer`) must be pre-registered in the OpenReplay dashboard or they're
 * silently dropped.
 */
export function identifyWaitlist(info: {
  /** Visitor uid — re-set after an email-merge changes it. */
  uid?: string
  /** Waitlist position once joined. */
  index?: number
  preference?: string
  /** Who referred this visitor (their uid), if any. */
  referrer?: string | null
}) {
  if (!tracker) return
  if (info.uid) tracker.setUserID(info.uid)
  if (info.referrer) tracker.setMetadata('referrer', info.referrer)
  if (info.index != null) tracker.setMetadata('waitlist_index', String(info.index))
  if (info.preference) tracker.setMetadata('preference', info.preference)
}
