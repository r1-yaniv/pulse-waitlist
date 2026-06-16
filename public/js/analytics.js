/**
 * OpenReplay session replay, loaded from a CDN (ESM) so there's no build step.
 * The project key is a public, client-side identifier (it ships in the browser
 * by design). Only initialised on the deployed site — never on localhost.
 */
import { getOrCreateUid } from './identity.js'

const PROJECT_KEY = 'csyBy6nxAxZObpNlcR18'
const TRACKER_URL = 'https://esm.sh/@openreplay/tracker@17.2.11'

let tracker = null

const isLocal = () =>
  ['localhost', '127.0.0.1', '0.0.0.0', ''].includes(location.hostname) ||
  location.hostname.endsWith('.local')

/**
 * Start OpenReplay, identifying the session by the visitor's persistent uid
 * (anonymous — no email/PII is ever sent). Idempotent; failures never bubble
 * up to the page. Dynamically imports the tracker so a CDN hiccup can't block
 * the rest of the app from loading.
 */
export async function initOpenReplay() {
  if (tracker || isLocal()) return
  try {
    const mod = await import(/* @vite-ignore */ TRACKER_URL)
    const OpenReplay = mod.default
    tracker = new OpenReplay({ projectKey: PROJECT_KEY })
    await tracker.start({ userID: getOrCreateUid() })
  } catch {
    /* analytics is best-effort — don't let it break the site */
    tracker = null
  }
}

/**
 * Enrich the current session with waitlist context. No-op when the tracker
 * isn't running. Metadata keys (`waitlist_index`, `preference`, `referrer`)
 * must be pre-registered in the OpenReplay dashboard or they're silently
 * dropped.
 */
export function identifyWaitlist(info) {
  if (!tracker) return
  if (info.uid) tracker.setUserID(info.uid)
  if (info.referrer) tracker.setMetadata('referrer', info.referrer)
  if (info.index != null) tracker.setMetadata('waitlist_index', String(info.index))
  if (info.preference) tracker.setMetadata('preference', info.preference)
}
