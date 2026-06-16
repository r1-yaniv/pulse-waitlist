/**
 * Entry point. Wires the trailer mute toggle, the scroll-driven animations
 * (reveals, wordmark rise, EKG line draw), the waitlist UI, and analytics.
 * Loaded as a deferred module, so the DOM is ready when this runs.
 */
import { isCoarsePointer, onReveal, scrollProgress } from './scrollfx.js'
import { initWaitlist } from './waitlist-ui.js'
import { initOpenReplay } from './analytics.js'

const reducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

// --------------------------- trailer mute toggle ---------------------------
function initMuteToggle() {
  const video = document.getElementById('trailer')
  const btn = document.getElementById('mute-btn')
  const iconMuted = btn.querySelector('.icon-muted')
  const iconUnmuted = btn.querySelector('.icon-unmuted')
  if (!video || !btn) return

  btn.addEventListener('click', () => {
    const next = !video.muted
    video.muted = next
    if (!next) video.play().catch(() => {})
    iconMuted.hidden = !next
    iconUnmuted.hidden = next
    btn.setAttribute('aria-label', next ? 'Unmute trailer' : 'Mute trailer')
    btn.setAttribute('aria-pressed', String(!next))
  })
}

// --------------------------- scroll animations ---------------------------
function initAnimations() {
  const touch = isCoarsePointer()
  const reduced = reducedMotion()

  // On touch devices, scroll-triggered reveals fire while the content is still
  // far below the fold (sections are ~100vh tall), so the fade finishes
  // off-screen and the element "pops" in already-final — and under momentum
  // scrolling it never reads as a smooth fade anyway. Show everything in its
  // final state instead and skip the per-frame scroll work entirely. The
  // wordmark and EKG line have no CSS hidden state (only JS applies one), so
  // leaving them untouched renders them fully revealed; `.no-scrollfx` does the
  // same for the `fx-reveal` stacks.
  if (touch) {
    document.documentElement.classList.add('no-scrollfx')
    return
  }

  // Showcase copy column: staggered fade/rise at "top 62%".
  const showcase = document.querySelector('.showcase')
  const scText = document.querySelector('.sc-text')
  if (showcase && scText) {
    onReveal(showcase, 0.62, () => scText.classList.add('is-in'))
  }

  const outro = document.getElementById('outro')
  const outroStack = document.getElementById('outro-stack')
  const wordmark = document.getElementById('outro-wordmark')

  // Outro heading stack: staggered fade/rise at "top 55%".
  if (outro && outroStack) {
    onReveal(outro, 0.55, () => outroStack.classList.add('is-in'))
  }

  // Giant wordmark surfaces from below — once on enter for touch, scrubbed
  // top-bottom→bottom-bottom on pointer devices.
  if (outro && wordmark && !reduced) {
    if (touch) {
      wordmark.style.transition = 'transform 1s cubic-bezier(0.22, 0.61, 0.36, 1)'
      wordmark.style.transform = 'translateY(140px)'
      onReveal(outro, 0.7, () => { wordmark.style.transform = 'translateY(0px)' })
    } else {
      scrollProgress(
        outro,
        ({ top, height, vh }) => [top - vh, top + height - vh],
        (p) => { wordmark.style.transform = `translateY(${140 * (1 - p)}px)` },
      )
    }
  }

  // EKG pulse line: draw once on enter (touch) / scrubbed to max scroll (pointer).
  const svg = document.getElementById('pulse-line')
  if (svg && !reduced) {
    const paths = Array.from(svg.querySelectorAll('path'))
    const lengths = paths.map((path) => {
      const len = path.getTotalLength()
      path.style.strokeDasharray = String(len)
      path.style.strokeDashoffset = String(len)
      if (touch) path.style.transition = 'stroke-dashoffset 1.1s cubic-bezier(0.22, 0.61, 0.36, 1)'
      return len
    })
    if (touch) {
      onReveal(svg, 0.8, () => paths.forEach((path) => { path.style.strokeDashoffset = '0' }))
    } else {
      scrollProgress(
        svg,
        ({ top, vh, maxScroll }) => [top - vh, maxScroll],
        (p) => paths.forEach((path, i) => { path.style.strokeDashoffset = String(lengths[i] * (1 - p)) }),
      )
    }
  }
}

// --------------------------- boot ---------------------------
initMuteToggle()
initAnimations()
initWaitlist()
initOpenReplay()
