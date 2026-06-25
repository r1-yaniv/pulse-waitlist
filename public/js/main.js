/**
 * Entry point. Wires the trailer mute toggle, the scroll-driven animations
 * (reveals, wordmark rise, EKG line draw), the waitlist UI, and analytics.
 * Loaded as a deferred module, so the DOM is ready when this runs.
 */
import { isCoarsePointer, onReveal, scrollProgress } from './scrollfx.js'
import { initWaitlist } from './waitlist-ui.js'
import { initOpenReplay } from './analytics.js'
import { initProfitChart } from './profit-chart.js'

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
    // `<svg>` is an SVGElement, which has no `hidden` IDL property — assigning
    // `.hidden` sets a dead expando, not the content attribute, so the CSS
    // `[hidden]` rule never matches. Toggle the attribute itself.
    iconMuted.toggleAttribute('hidden', !next)
    iconUnmuted.toggleAttribute('hidden', next)
    btn.setAttribute('aria-label', next ? 'Unmute trailer' : 'Mute trailer')
    btn.setAttribute('aria-pressed', String(!next))
  })
}

// --------------------------- profit chart (graph hero) ---------------------------
// Builds the chart and returns its handle (or null). Revealing the lines and
// kicking off autoplay is owned by the graph-hero intro choreography below, so
// it can be sequenced after the title and the chart frame.
function initGraphChart() {
  const root = document.getElementById('profit-chart')
  if (!root) return null
  return initProfitChart(root) || null
}

// --------------------------- graph hero intro choreography ---------------------------
// Deliberate above-the-fold reveal sequence on load:
//   1) title + subtitle rise in
//   2) the chart frame appears and its P&L lines draw on
//   3) the "See The Difference" titlebar (eyebrow + play/pause control) fades in
//   4) the chart starts its walkthrough autoplay immediately — the moment the
//      titlebar reveals, no idle wait; hovering the chart interrupts it as usual
// The closing "Trading blind…" line is intentionally NOT part of this sequence —
// it reveals on scroll (see initAnimations). Touch / reduced-motion skip the
// staged timing and show everything at once.
const GH_SEQ = {
  headMs: 250, // title + subtitle
  chartMs: 1050, // chart frame fades in + line draw-on begins
  titleMs: 2850, // "See The Difference" + autoplay — after the lines have drawn in
}

function initGraphHeroSequence(chart) {
  const ghHead = document.querySelector('.gh-head')
  const ghChart = document.querySelector('.gh-chart-wrap')
  const ghTitlebar = document.querySelector('.gh-chart-titlebar')
  const reveal = (elm) => elm && elm.classList.add('is-in')

  // Mount the chart's play/pause control beside the "See The Difference" line.
  if (chart && chart.playButton && ghTitlebar) ghTitlebar.appendChild(chart.playButton)

  // Touch / reduced motion: no staged timing — show it all and reveal the chart.
  if (reducedMotion() || isCoarsePointer()) {
    reveal(ghHead)
    reveal(ghChart)
    reveal(ghTitlebar)
    if (chart) chart.reveal()
    return
  }

  setTimeout(() => reveal(ghHead), GH_SEQ.headMs)
  setTimeout(() => {
    reveal(ghChart)
    if (chart) chart.reveal() // draws the lines in
  }, GH_SEQ.chartMs)
  setTimeout(() => {
    reveal(ghTitlebar)
    if (chart) chart.play() // kick off the walkthrough right away
  }, GH_SEQ.titleMs)
}

// --------------------------- scroll animations ---------------------------
function initAnimations() {
  const touch = isCoarsePointer()
  const reduced = reducedMotion()

  // NOTE: the graph-hero title, chart frame, line draw-on, "See The Difference"
  // eyebrow and autoplay are choreographed on load by initGraphHeroSequence().
  // The closing "Trading blind…" line below is the one graph-hero element that
  // reveals on scroll instead.

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

  // Closing "Trading blind…" line: reveals as it scrolls into view (it sits at
  // the bottom of the ~100svh graph hero, below the fold on load).
  const ghBottom = document.querySelector('.gh-bottomline')
  if (ghBottom) onReveal(ghBottom, 0.85, () => ghBottom.classList.add('is-in'))

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
const profitChart = initGraphChart()
initGraphHeroSequence(profitChart)
initAnimations()
initWaitlist()
initOpenReplay()
