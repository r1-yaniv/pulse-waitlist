import OpenReplay from '@openreplay/tracker'

// OpenReplay session replay. The project key is a public, client-side
// identifier (it ships in the browser bundle by design), so it lives in source.
// ingestPoint is omitted — it defaults to OpenReplay Cloud.
const PROJECT_KEY = 'csyBy6nxAxZObpNlcR18'

let started = false

/** Start OpenReplay. Idempotent; failures never bubble up to the page. */
export function initOpenReplay() {
  if (started) return
  started = true
  const tracker = new OpenReplay({ projectKey: PROJECT_KEY })
  void tracker.start().catch(() => {
    /* analytics is best-effort — don't let it break the site */
  })
}
