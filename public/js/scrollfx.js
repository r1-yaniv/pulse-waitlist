/**
 * Native scroll-driven animation primitives (no GSAP, no build step).
 *   • onReveal        — one-shot enter reveal (IntersectionObserver)
 *   • scrollProgress  — scroll-scrubbed 0..1 progress (scroll + rAF)
 * Both respect `prefers-reduced-motion`: reveals fire immediately and scrubs
 * don't subscribe, leaving elements at their natural (final) CSS state.
 */

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** True on touch/momentum-scrolling devices, where scroll *events* are too
 *  sparse to scrub smoothly (the page still scrolls fine via the compositor). */
export const isCoarsePointer = () =>
  window.matchMedia('(pointer: coarse)').matches

/**
 * Calls `cb` once when `el`'s top edge crosses `line` (a fraction down the
 * viewport, e.g. 0.62 ≈ GSAP's "top 62%"). Disabled / reduced-motion fires
 * `cb` immediately so content shows. Returns a cleanup function.
 */
export function onReveal(el, line = 0.6, cb, enabled = true) {
  if (!el) return () => {}
  if (!enabled || prefersReducedMotion()) {
    cb()
    return () => {}
  }
  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        cb()
        io.disconnect()
      }
    },
    // Shrink the root from the bottom so intersection begins when the element's
    // top reaches the `line` fraction down the viewport.
    { rootMargin: `0px 0px ${-(1 - line) * 100}% 0px` },
  )
  io.observe(el)
  return () => io.disconnect()
}

/**
 * Scroll-scrubbed progress for `el`. `range(metrics)` returns the
 * [startScroll, endScroll] document scroll positions between which progress
 * runs 0→1; `onProgress(p)` receives the clamped value on every scroll frame
 * and on resize. No-op under reduced motion / when disabled. Returns cleanup.
 * `metrics` = { top, height, vh, maxScroll }.
 */
export function scrollProgress(el, range, onProgress, enabled = true) {
  if (!el || !enabled || prefersReducedMotion()) return () => {}

  let start = 0
  let end = 1
  let ticking = false

  const measure = () => {
    const rect = el.getBoundingClientRect()
    const vh = window.innerHeight
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - vh)
    const r = range({ top: rect.top + window.scrollY, height: rect.height, vh, maxScroll })
    start = r[0]
    end = r[1]
  }
  const update = () => {
    ticking = false
    const span = end - start
    const p = span <= 0 ? 0 : Math.min(1, Math.max(0, (window.scrollY - start) / span))
    onProgress(p)
  }
  const onScroll = () => {
    if (ticking) return
    ticking = true
    requestAnimationFrame(update)
  }
  const onResize = () => {
    measure()
    update()
  }

  measure()
  update()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onResize)
  return () => {
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onResize)
  }
}
