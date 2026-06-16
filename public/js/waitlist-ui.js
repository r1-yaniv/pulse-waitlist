/**
 * Waitlist UI: the single source of truth for the visitor's uid / position /
 * live count, plus the floating CTA pill, the share modal, and the dock that
 * carries the pill into the page. Ports the former useWaitlist hook +
 * WaitlistCTA + ShareModalCard components to vanilla DOM.
 */
import { captureRef, getOrCreateUid, getStoredRef, setUid } from './identity.js'
import { identifyWaitlist } from './analytics.js'
import * as api from './api.js'

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

// ----- shared state -----
const state = {
  uid: '',
  status: null, // null = loading; {joined:false} | {joined:true,index,preference}
  count: null,
  expanded: false,
  choice: null, // 'updates' | 'launch'
  submitting: false,
  shareOpen: false,
}

// ----- elements (resolved in init) -----
let el = {}

export function initWaitlist() {
  el = {
    root: document.getElementById('cta-root'),
    pill: document.getElementById('cta-pill'),
    joinedIndex: document.getElementById('cta-joined-index'),
    form: document.getElementById('cta-form'),
    email: document.getElementById('cta-email'),
    submit: document.getElementById('cta-submit'),
    arrow: document.querySelector('.cta-arrow'),
    spinner: document.querySelector('.cta-spinner'),
    error: document.getElementById('cta-error'),
    choices: Array.from(document.querySelectorAll('.cta-choice')),
    count: document.getElementById('cta-count'),
    dock: document.getElementById('cta-dock'),
    // share modal
    overlay: document.getElementById('share-overlay'),
    shareIndex: document.getElementById('share-index'),
    shareLink: document.getElementById('share-link-text'),
    shareCopy: document.getElementById('share-copy'),
    shareCopyLabel: document.getElementById('share-copy-label'),
    iconCopy: document.querySelector('.share-copy .icon-copy'),
    iconCheck: document.querySelector('.share-copy .icon-check'),
    prefChoices: Array.from(document.querySelectorAll('.share-pref-choice')),
    prefStatus: document.getElementById('share-pref-status'),
  }

  bootstrap()
  wireCta()
  wireShare()
  wireDock()
  render()
}

// --------------------------- data bootstrap ---------------------------
function bootstrap() {
  const uid = getOrCreateUid()
  state.uid = uid
  captureRef()
  identifyWaitlist({ uid, referrer: getStoredRef() ?? undefined })

  const refreshCount = () =>
    api
      .getCount()
      .then((r) => {
        state.count = r.count
        renderCount()
      })
      .catch(() => {/* keep last known value */})

  api
    .getStatus(uid)
    .then((s) => {
      state.status = s
      if (s.joined) identifyWaitlist({ index: s.index, preference: s.preference })
      render()
    })
    .catch(() => {
      state.status = { joined: false }
      render()
    })

  refreshCount()

  // Poll the count, never while the tab is hidden; refetch on becoming visible.
  let timer
  const start = (ms) => {
    if (timer) clearInterval(timer)
    timer = setInterval(() => {
      if (document.visibilityState === 'visible') refreshCount()
    }, ms)
  }
  api
    .getConfig()
    .then((c) => start(c.countRefreshMs || 60_000))
    .catch(() => start(60_000))

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refreshCount()
  })
}

async function join(email, preference) {
  const res = await api.join({
    uid: state.uid,
    email,
    preference,
    ref: getStoredRef(),
  })
  // An email already on the list returns its original uid — adopt it.
  if (res.merged && res.uid !== state.uid) {
    state.uid = res.uid
    setUid(res.uid)
  }
  state.status = { joined: true, index: res.index, preference: res.preference }
  if (!res.merged && state.count != null) state.count += 1
  identifyWaitlist({
    uid: state.uid,
    index: res.index,
    preference: res.preference,
    referrer: getStoredRef() ?? undefined,
  })
  return res
}

// --------------------------- CTA pill ---------------------------
function wireCta() {
  const activate = () => {
    if (state.status && state.status.joined) openShare()
    else if (!state.expanded) {
      state.expanded = true
      render()
      window.setTimeout(() => el.email && el.email.focus(), 180)
    }
  }

  el.pill.addEventListener('click', activate)
  el.pill.addEventListener('keydown', (e) => {
    const asButton = (state.status && state.status.joined) || !state.expanded
    if (asButton && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      activate()
    }
  })

  el.choices.forEach((btn) => {
    btn.addEventListener('click', () => {
      state.choice = btn.dataset.choice
      el.choices.forEach((b) => {
        const on = b.dataset.choice === state.choice
        b.classList.toggle('is-selected', on)
        b.setAttribute('aria-pressed', String(on))
      })
      if (el.error.textContent) showError('')
    })
  })

  el.email.addEventListener('input', () => {
    if (el.error.textContent) showError('')
  })

  el.form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const email = el.email.value.trim()
    if (!EMAIL_RE.test(email)) {
      showError('Enter a valid email')
      return
    }
    if (!state.choice) {
      showError('Pick one option above so we know how to reach you')
      return
    }
    setSubmitting(true)
    showError('')
    try {
      await join(email, state.choice)
      collapse()
      openShare()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  })

  // Escape or an outside click collapses the bar back to the pill.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.expanded) collapse()
  })
  document.addEventListener('mousedown', (e) => {
    if (state.expanded && el.pill && !el.pill.contains(e.target)) collapse()
  })
}

function collapse() {
  state.expanded = false
  el.email.value = ''
  showError('')
  render()
}

function setSubmitting(on) {
  state.submitting = on
  el.submit.disabled = on
  el.arrow.hidden = on
  el.spinner.hidden = !on
}

function showError(msg) {
  el.error.textContent = msg
  el.error.classList.toggle('is-shown', Boolean(msg))
}

// --------------------------- render ---------------------------
function render() {
  const joined = Boolean(state.status && state.status.joined)
  el.pill.classList.toggle('is-joined', joined)
  el.pill.classList.toggle('is-expanded', state.expanded && !joined)

  if (joined) {
    el.joinedIndex.textContent = state.status.index.toLocaleString('en-US')
    el.pill.setAttribute(
      'aria-label',
      `You are number ${state.status.index} on the waitlist — open your share card`,
    )
  } else if (state.expanded) {
    el.pill.removeAttribute('aria-label')
  } else {
    el.pill.setAttribute('aria-label', 'Join the waitlist')
  }

  const asButton = joined || !state.expanded
  if (asButton) {
    el.pill.setAttribute('role', 'button')
    el.pill.setAttribute('tabindex', '0')
  } else {
    el.pill.removeAttribute('role')
    el.pill.setAttribute('tabindex', '-1')
  }

  renderCount()
}

function renderCount() {
  if (state.count == null) {
    el.count.hidden = true
    return
  }
  el.count.hidden = false
  if (state.count === 0) {
    el.count.textContent = 'Be the first to join'
  } else {
    el.count.replaceChildren()
    const num = document.createElement('span')
    num.className = 'cta-count-num'
    num.textContent = state.count.toLocaleString('en-US')
    el.count.append(num, document.createTextNode(' already on the list'))
  }
}

// --------------------------- share modal ---------------------------
function wireShare() {
  el.overlay.addEventListener('click', closeShare)
  el.overlay
    .querySelector('.share-scale')
    .addEventListener('click', (e) => e.stopPropagation())
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.shareOpen) closeShare()
  })
  el.shareCopy.addEventListener('click', copyLink)
  el.prefChoices.forEach((btn) => {
    btn.addEventListener('click', () => changePreference(btn.dataset.pref))
  })
}

function renderPref() {
  const current = state.status && state.status.preference
  el.prefChoices.forEach((b) => {
    const on = b.dataset.pref === current
    b.classList.toggle('is-selected', on)
    b.setAttribute('aria-pressed', String(on))
  })
}

function setPrefStatus(msg, isError) {
  el.prefStatus.textContent = msg
  el.prefStatus.classList.toggle('is-shown', Boolean(msg))
  el.prefStatus.classList.toggle('is-error', Boolean(isError))
}

let prefStatusTimer
async function changePreference(pref) {
  if (!(state.status && state.status.joined)) return
  if (state.status.preference === pref) return

  const prev = state.status.preference
  state.status.preference = pref // optimistic
  renderPref()
  el.prefChoices.forEach((b) => (b.disabled = true))
  if (prefStatusTimer) clearTimeout(prefStatusTimer)
  setPrefStatus('Saving…', false)

  try {
    const res = await api.setPreference({ uid: state.uid, preference: pref })
    state.status.preference = res.preference
    renderPref()
    identifyWaitlist({ uid: state.uid, preference: res.preference })
    setPrefStatus('Saved', false)
    prefStatusTimer = window.setTimeout(() => setPrefStatus('', false), 1800)
  } catch (err) {
    state.status.preference = prev // roll back
    renderPref()
    setPrefStatus(err instanceof Error ? err.message : 'Could not save', true)
  } finally {
    el.prefChoices.forEach((b) => (b.disabled = false))
  }
}

function openShare() {
  if (!(state.status && state.status.joined)) return
  state.shareOpen = true

  const origin = window.location.host
  const displayLink = `${origin}/?ref=${state.uid}`
  el.shareIndex.textContent = state.status.index.toLocaleString('en-US')
  el.shareLink.textContent = displayLink
  el.shareCopy.dataset.url = `https://${displayLink}`
  resetCopy()
  renderPref()
  setPrefStatus('', false)

  el.overlay.hidden = false
  // The card stands in for the CTA while open.
  el.root.classList.add('is-hidden')
}

function closeShare() {
  state.shareOpen = false
  el.overlay.hidden = true
  el.root.classList.remove('is-hidden')
  // Re-measure the dock point now the pill is visible again.
  if (typeof window.__measureDock === 'function') window.__measureDock()
}

let copyTimer
function resetCopy() {
  el.iconCopy.hidden = false
  el.iconCheck.hidden = true
  el.shareCopyLabel.textContent = 'Copy'
  el.shareCopy.setAttribute('aria-label', 'Copy referral link')
}

async function copyLink() {
  const url = el.shareCopy.dataset.url || ''
  try {
    await navigator.clipboard.writeText(url)
  } catch {
    // Clipboard API can be blocked (insecure context / permissions). Fall back
    // to a hidden textarea + execCommand so the button still works.
    const ta = document.createElement('textarea')
    ta.value = url
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    try {
      document.execCommand('copy')
    } catch {
      /* nothing else to try */
    }
    document.body.removeChild(ta)
  }
  el.iconCopy.hidden = true
  el.iconCheck.hidden = false
  el.shareCopyLabel.textContent = 'Copied'
  el.shareCopy.setAttribute('aria-label', 'Link copied')
  if (copyTimer) clearTimeout(copyTimer)
  copyTimer = window.setTimeout(resetCopy, 1800)
}

// --------------------------- dock translate ---------------------------
function wireDock() {
  const root = el.root
  const dock = el.dock
  if (!root || !dock) return

  let dockScrollY = 0
  const apply = () => {
    root.style.transform = `translateY(${-Math.max(0, window.scrollY - dockScrollY)}px)`
  }
  const measure = () => {
    if (root.classList.contains('is-hidden')) return
    root.style.transform = 'translateY(0px)'
    const rootBottom = root.getBoundingClientRect().bottom // viewport, fixed
    const markerDocTop = dock.getBoundingClientRect().top + window.scrollY
    dockScrollY = markerDocTop - rootBottom
    apply()
  }
  // Exposed so closeShare() can re-measure once the pill is shown again.
  window.__measureDock = measure

  // Per-frame rAF (not scroll events): on touch the browser throttles scroll
  // events during momentum, so reading scrollY each frame keeps the pill locked
  // to the scroll position. A ResizeObserver re-measures when layout shifts
  // (resize, images/video loading, font swap).
  const loop = () => {
    apply()
    requestAnimationFrame(loop)
  }
  measure()
  requestAnimationFrame(loop)
  new ResizeObserver(measure).observe(document.body)
  window.addEventListener('resize', measure)
}
