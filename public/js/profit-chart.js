/**
 * Pulse profit-advantage chart — "With Pulse vs Without Pulse" over one season.
 *
 * Vanilla (no-framework) port of the Claude Design `PulseChart` reference
 * component. All scenario numbers (withArr / withoutArr / beats) are transcribed
 * from the modelling workbook (marketing/models/pulse-profit-model.xlsx) — see
 * the "P&L Over Time" and per-contract sheets. The headline advantage and the
 * multiplier are derived at runtime from the arrays, never hard-coded.
 *
 * Renders an SVG line chart with:
 *   • two marked-to-market P&L lines + shaded gap, drawn-on via stroke-dashoffset
 *   • three contract sections (band + dividers + labels)
 *   • typed event markers (buy ▲ / sell ▼ / resolve ✓ / context ●)
 *   • scrub interaction (hover desktop / drag mobile) with a live P&L readout
 *   • a context card on each beat, a "YOUR P&L" tooltip between beats
 *   • idle autoplay that walks beat→beat, pausing to read each card
 *
 * Public API: initProfitChart(root) — root is the [data-pchart] container.
 */

const SVG_NS = 'http://www.w3.org/2000/svg'

// --- palette (mirrors the site tokens / pnl-compare prototype) ---
const C = {
  accent: '#579dff',
  accentBright: '#85b8ff',
  without: '#6b7689',
  pos: '#35d6a4',
  neg: '#f8717d',
  buy: '#85b8ff',
  sell: '#9aa3b5',
  resolve: '#35d6a4',
  hold: '#6f7a90',
  ink: '#f1f4fa',
  inkMuted: '#aeb7c8',
  inkDim: '#5b6580',
  bg: '#070b12',
}
const MONO = "'Chakra Petch', ui-monospace, monospace"
const SANS = "'Chakra Petch', system-ui, sans-serif"

// ===========================================================================
//  AUTOPLAY TIMING — tweak these to control the walkthrough pacing.
//  The autoplay "walks" the scrubber from beat to beat: it SWEEPS along the
//  line, then PAUSES on each explanation card long enough to read it.
// ===========================================================================
const TIMING = {
  // How long each card stays up = (its word count ÷ readingWpm), then clamped
  // between minCardMs and maxCardMs. NOTE: if maxCardMs is too low, the longest
  // cards peg to it and readingWpm stops mattering for them — keep maxCardMs
  // high enough that your wpm setting actually bounds the longest card.
  readingWpm: 220, // words per minute — LOWER = cards stay up LONGER
  minCardMs: 1500, // never show a card for less than this
  maxCardMs: 12000, // never show a card for longer than this (safety cap)

  // Scrubber travel speed between beats.
  sweepMsPerWeek: 175, // ms per week-step — LOWER = faster scrub between cards
  sweepMinMs: 450, // clamp: shortest sweep
  sweepMaxMs: 3500, // clamp: longest sweep

  // Idle behaviour.
  autoStartDelaySec: 4, // seconds after load before autoplay first kicks off
  idleRestartSec: 4, // seconds of no interaction before autoplay restarts

  // Line "draw-on" — the P&L lines scrub in when the chart enters view.
  lineDrawMs: 1600, // duration of the draw-on — HIGHER = slower scrub-in
  lineDrawDelayMs: 90, // the With-Pulse line starts this long after the Without line
}

// Show an "N×" advantage badge between the With-Pulse and Without-Pulse points
// once With-Pulse P&L is at least this many times the Without-Pulse P&L.
const MULTIPLIER_THRESHOLD = 1.4

// --- scenario data (from the workbook; week 0..36) ---
const WITH = [0, 30, 60, 100, 130, 160, 190, 200, 120, 120, 120, 120, 229, 270, 311, 284, 365, 461, 570, 720, 884, 1047, 1184, 1214, 1234, 1204, 1174, 1154, 1134, 1254, 1434, 1634, 1814, 2014, 2234, 2414, 2534]
const WITHOUT = [0, 30, 60, 100, 130, 160, 190, 200, 170, 100, 20, -100, -100, -70, -40, -60, 0, 70, 150, 260, 380, 500, 600, 630, 650, 620, 590, 550, 530, 500, 450, 390, 330, 270, 210, 170, 150]
const LAST = WITH.length - 1 // 36

const BEATS = [
  { wk: 0, icon: '', tag: 'OPEN · CONTRACT 1', title: 'Buy 2026 NBA Champion Contract', detail: 'Buy 1,000 shares at 40¢' },
  { wk: 7, icon: '', tag: 'RUNNING HOT', title: 'Both up +$200', detail: 'Contract climbs to 60¢' },
  { wk: 8, icon: '', tag: 'PULSE ALERT', title: 'A star injury flips the thesis', detail: 'Pulse fires an instant, contextual alert. You exit at 52¢ and lock +$120.', down: 'Trading blind, you don’t see it coming. When you understand the drop, it is too late.' },
  { wk: 11, icon: '', onWith: false, tag: 'BLIND EXITS LATE', title: 'The crowd sells into the slide', detail: '', down: 'Without Pulse you bail at 30¢, booking −$100 instead of +$120.' },
  { wk: 12, icon: '', tag: 'OPEN · CONTRACT 2', title: 'Buy Super Bowl Contract', detail: 'For the same $300, Pulse suggests buying on Kalshi for 22¢ → 1,364 shares.', down: 'You overpay at 30¢, securing 30% less shares, for the same cash.' },
  { wk: 22, icon: '', tag: 'RESOLVE + ROLL', title: 'Super Bowl Contract Payout', detail: 'Contract 2 resolves. Pulse-users get paid $1,064.\nBoth roll profits into a Champions League Contract, but as a Pulse user you see the full picture and back the undervalued team.', down: 'You miss out on extra $364 on Contract 2, and make an uneducated decision to bet on the hyped team.' },
  { wk: 28, icon: '', tag: 'PULSE ADDS', title: 'Buy the dip with conviction', detail: 'Underdog keeps slipping. Pulse’s read: the thesis is intact. You buy the dip and add more shares.', down: 'You miss the full story.' },
  { wk: LAST, icon: '', tag: 'CONTRACT 3 RESOLVES', title: 'Underdog wins', detail: '', down: 'You miss out on another $1,800.' },
]

const SECTIONS = [
  { a: 0, b: 11.5, t: '1 · THE ALERT' },
  { a: 11.5, b: 22, t: '2 · THE CHEAPER VENUE' },
  { a: 22, b: LAST, t: '3 · THE EDUCATED EDGE' },
]

// --- geometry ---
const W = 1000
const ML = 74
const MR = 40
const MT = 28
const MB = 34
const Y_MIN = -250
const Y_MAX = 2700

const el = (tag, attrs, kids) => mk(document.createElement(tag), attrs, kids)
const svgEl = (tag, attrs, kids) => mk(document.createElementNS(SVG_NS, tag), attrs, kids)
function mk(node, attrs, kids) {
  if (attrs) for (const k in attrs) {
    const v = attrs[k]
    if (v == null) continue
    if (k === 'style') node.setAttribute('style', v)
    else if (k === 'text') node.textContent = v
    else node.setAttribute(k, v)
  }
  if (kids) for (const c of [].concat(kids)) if (c != null) node.appendChild(c)
  return node
}

export function initProfitChart(root) {
  if (!root) return
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const uid = 'pc' + Math.random().toString(36).slice(2, 7)

  const state = {
    hover: null, // week index while scrubbing, or null
    revealed: false,
    drawn: false, // line draw-on has begun (don't re-animate on later renders)
    playing: false,
    paused: false, // button-paused: frozen on the current step, resumable
    playWeek: LAST,
    isMobile: detectMobile(),
  }
  let inGraph = false
  let idleTimer = null
  let playIv = null
  let playSegs = null
  let playTotal = 0
  let playT0 = 0
  let playElapsed = 0 // ms into the timeline — kept across a button-pause so play resumes
  let pausePending = false // pause clicked mid-sweep: finish the transition, then freeze
  let btnShowsPause = null // last play/pause icon shown — avoids rebuilding the button every frame
  let barFill = null
  // Live refs to the two line paths + gap fill so the draw-on can be applied
  // after they are inserted into the DOM (where getTotalLength is reliable).
  let lineWith = null
  let lineWithout = null
  let gapEl = null
  let markerEls = [] // per-beat marker <g> (index matches BEATS)
  let epGroup = null // end-point dots + labels

  function detectMobile() {
    try { return window.matchMedia('(max-width: 720px)').matches } catch (e) { return false }
  }
  const eh = () => (state.isMobile ? 920 : 560)
  const x = (w) => ML + (w / LAST) * ((W - MR) - ML)
  const y = (v) => {
    const pt = MT, pb = eh() - MB
    return pb - ((v - Y_MIN) / (Y_MAX - Y_MIN)) * (pb - pt)
  }
  const fmt = (v) => {
    const a = Math.abs(Math.round(v))
    const s = v < 0 ? '−' : (v > 0 ? '+' : '')
    return s + '$' + a.toLocaleString('en-US')
  }
  const interpAt = (arr, wf) => {
    const i = Math.max(0, Math.min(LAST, Math.floor(wf)))
    const j = Math.min(LAST, i + 1)
    return arr[i] + (arr[j] - arr[i]) * (wf - i)
  }

  // ---- structural DOM (built once) ----
  root.classList.add('pchart')
  const legend = el('div', { class: 'pchart-legend' })
  const frame = el('div', { class: 'pchart-frame' })
  const svgHost = el('div', { class: 'pchart-svg' })
  const card = el('div', { class: 'pchart-card', hidden: '' })
  const playBtn = el('button', { class: 'pchart-play', type: 'button', 'aria-label': 'Play the story' })
  // Inline SVG (not Unicode ▶/⏸, which render as emoji on mobile) — matches the
  // site's other lucide-style icons (currentColor).
  const playIcon = () => svgEl('svg', { viewBox: '0 0 24 24', width: 15, height: 15, fill: 'currentColor', 'aria-hidden': 'true' }, [
    svgEl('path', { d: 'M8 5v14l11-7z' }),
  ])
  const pauseIcon = () => svgEl('svg', { viewBox: '0 0 24 24', width: 15, height: 15, fill: 'currentColor', 'aria-hidden': 'true' }, [
    svgEl('rect', { x: 6, y: 5, width: 4, height: 14, rx: 1 }),
    svgEl('rect', { x: 14, y: 5, width: 4, height: 14, rx: 1 }),
  ])
  // Header row: the "YOUR P&L" legend. The play/pause control (playBtn) is
  // built here but mounted next to the "See The Difference" title by main.js —
  // it keeps all its wiring regardless of where in the DOM it lives.
  const head = el('div', { class: 'pchart-head' }, [legend])
  frame.append(head, svgHost, card)
  root.append(frame)

  playBtn.addEventListener('click', () => { if (state.playing) pausePlay(); else play() })

  // ---- render ----
  function render() {
    const mob = state.isMobile
    let ew, ewf, mode
    if (state.playing) { ewf = state.playWeek; ew = Math.round(ewf); mode = 'play' }
    else if (state.hover !== null) { ew = state.hover; ewf = state.hover; mode = 'hover' }
    // Button-paused (and not being scrubbed): freeze on the current step.
    else if (state.paused) { ewf = state.playWeek; ew = Math.round(ewf); mode = 'play' }
    else { ew = LAST; ewf = LAST; mode = 'overall' }

    const w = WITH[ew], wo = WITHOUT[ew]

    const exactIdx = BEATS.findIndex((b) => b.wk === ew)
    const activeIdx = mode === 'overall' ? -1 : exactIdx
    const onBeat = activeIdx >= 0
    const showPnl = mode !== 'overall' && !onBeat

    // live legend (with vs without), colored by who's ahead
    const aheadW = w >= wo
    legend.replaceChildren(
      el('span', { class: 'pchart-legend-eyebrow' }, [document.createTextNode('YOUR P&L')]),
      legendItem(C.accent, 'With Pulse', fmt(w), aheadW ? C.pos : C.neg),
      legendItem(C.without, 'Without', fmt(wo), !aheadW ? C.pos : C.neg),
    )

    // chart svg
    svgHost.replaceChildren(buildChart({ ewf, mode, activeIdx, showPnl, w: WITH[ew], wo: WITHOUT[ew] }))
    applyDraw()

    // context card
    if (onBeat) {
      const b = BEATS[activeIdx]
      renderCard(b)
      positionCard(b)
      card.removeAttribute('hidden')
    } else {
      card.setAttribute('hidden', '')
    }

    // A queued pause (clicked mid-sweep) reads as "pausing" right away: show the
    // play icon even though the sweep is still finishing. Only rebuild the button
    // when the icon actually changes — render() runs ~25×/s during a sweep, and
    // tearing out the icon every frame was eating clicks mid-transition.
    const showPause = state.playing && !pausePending
    if (showPause !== btnShowsPause) {
      btnShowsPause = showPause
      playBtn.replaceChildren(showPause ? pauseIcon() : playIcon())
      playBtn.setAttribute('aria-label', showPause ? 'Pause' : 'Play the story')
    }
    frame.classList.toggle('is-mobile', mob)
  }

  // Draw-on for the P&L lines. Lines/gap are inserted plain; here we either
  // hide them (before reveal), animate them in once (on reveal), or leave them
  // visible (after the draw has played / under reduced motion).
  function applyDraw() {
    if (!lineWith || !lineWithout) return
    if (!state.revealed) {
      hideLine(lineWithout)
      hideLine(lineWith)
      if (gapEl) gapEl.style.opacity = '0'
      return
    }
    if (state.drawn || reduced) return // built plain → already fully visible
    // Mark the draw as done synchronously so any render that lands while the
    // animation is still running (e.g. autoplay starting on cue) leaves the
    // freshly-built plain lines visible instead of re-animating the draw-on.
    state.drawn = true
    drawLine(lineWithout, 0)
    drawLine(lineWith, TIMING.lineDrawDelayMs)
    if (gapEl) {
      gapEl.style.opacity = '1'
      gapEl.animate(
        [{ opacity: 0 }, { opacity: 1 }],
        { duration: TIMING.lineDrawMs, delay: Math.round(TIMING.lineDrawMs * 0.4), easing: 'ease', fill: 'both' },
      )
    }
    // Pop each marker in just as the drawing line reaches its week, so the icons
    // don't float ahead of the line.
    markerEls.forEach((gEl, i) => {
      const b = BEATS[i]
      const lineDelay = b.onWith === false ? 0 : TIMING.lineDrawDelayMs
      const delay = Math.round(lineDelay + (b.wk / LAST) * TIMING.lineDrawMs * 0.92)
      gEl.style.opacity = '1'
      gEl.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, delay, easing: 'ease', fill: 'both' })
    })
    // End-point dots/labels appear as the line reaches the end.
    if (epGroup) {
      epGroup.style.opacity = '1'
      epGroup.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 280, delay: Math.round(TIMING.lineDrawDelayMs + TIMING.lineDrawMs * 0.9), easing: 'ease', fill: 'both' })
    }
  }
  function hideLine(p) {
    const len = p.getTotalLength()
    p.style.strokeDasharray = String(len)
    p.style.strokeDashoffset = String(len)
  }
  // Web Animations API: driven by the document timeline (plays reliably without
  // a reflow hack). The line's resting style is offset 0 (fully drawn).
  function drawLine(p, delay) {
    const len = p.getTotalLength()
    p.style.strokeDasharray = String(len)
    p.style.strokeDashoffset = '0'
    p.animate(
      [{ strokeDashoffset: len }, { strokeDashoffset: 0 }],
      { duration: TIMING.lineDrawMs, delay, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'both' },
    )
  }

  function legendItem(dot, label, val, valColor) {
    return el('span', { class: 'pchart-legend-item' }, [
      el('span', { class: 'pchart-legend-dot', style: `background:${dot}` }),
      el('span', { class: 'pchart-legend-label' }, [document.createTextNode(label)]),
      el('span', { class: 'pchart-legend-val', style: `color:${valColor}` }, [document.createTextNode(val)]),
    ])
  }

  function renderCard(b) {
    const kids = [
      el('div', { class: 'pchart-card-head' }, [
        el('span', { class: 'pchart-card-icon' }, [document.createTextNode(b.icon)]),
        el('span', { class: 'pchart-card-tag' }, [document.createTextNode(b.tag)]),
      ]),
      el('div', { class: 'pchart-card-title' }, [document.createTextNode(b.title)]),
    ]
    if (b.detail) kids.push(el('div', { class: 'pchart-card-detail' }, [document.createTextNode(b.detail)]))
    if (b.down) kids.push(el('div', { class: 'pchart-card-down' }, [
      el('div', { class: 'pchart-card-down-label' }, [document.createTextNode('WITHOUT PULSE')]),
      el('div', { class: 'pchart-card-down-text' }, [document.createTextNode(b.down)]),
    ]))
    if (state.playing) {
      barFill = el('div', { class: 'pchart-card-bar-fill' })
      kids.push(el('div', { class: 'pchart-card-bar' }, [barFill]))
    }
    card.replaceChildren(...kids)
  }

  function positionCard(b) {
    const yval = b.onWith === false ? WITHOUT[b.wk] : WITH[b.wk]
    if (state.isMobile) {
      card.style.left = '13px'
      card.style.right = '13px'
      card.style.top = '64px'
      card.style.transform = 'none'
      return
    }
    const mx = (x(b.wk) / W) * 100
    const my = (y(yval) / eh()) * 100
    let tx = '-50%'
    if (mx > 86) tx = '-96%'
    else if (mx > 62) tx = '-84%'
    else if (mx < 14) tx = '-4%'
    else if (mx < 24) tx = '-16%'
    const ty = my < 42 ? '18px' : 'calc(-100% - 18px)'
    card.style.left = mx.toFixed(1) + '%'
    card.style.right = 'auto'
    card.style.top = my.toFixed(1) + '%'
    card.style.transform = `translate(${tx}, ${ty})`
  }

  function buildChart({ ewf, mode, activeIdx, showPnl, w, wo }) {
    const H = eh(), plotR = W - MR, plotT = MT, plotB = H - MB
    const rv = state.revealed, mob = state.isMobile, k = mob ? 2.8 : 1
    const wpts = WITH.map((v, i) => [x(i), y(v)])
    const opts = WITHOUT.map((v, i) => [x(i), y(v)])
    const ps = (p) => p.map((q, i) => (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join(' ')
    const withPath = ps(wpts), withoutPath = ps(opts)
    let gp = ps(wpts)
    for (let i = LAST; i >= 0; i--) gp += ' L' + opts[i][0].toFixed(1) + ' ' + opts[i][1].toFixed(1)
    gp += ' Z'

    const kids = []
    kids.push(svgEl('defs', null, [
      svgEl('linearGradient', { id: uid + 'gap', x1: 0, y1: 0, x2: 0, y2: 1 }, [
        svgEl('stop', { offset: '0%', 'stop-color': C.accent, 'stop-opacity': 0.30 }),
        svgEl('stop', { offset: '62%', 'stop-color': C.accent, 'stop-opacity': 0.07 }),
        svgEl('stop', { offset: '100%', 'stop-color': C.accent, 'stop-opacity': 0.01 }),
      ]),
      svgEl('linearGradient', { id: uid + 'ln', x1: 0, y1: 0, x2: 1, y2: 0 }, [
        svgEl('stop', { offset: '0%', 'stop-color': C.accentBright }),
        svgEl('stop', { offset: '100%', 'stop-color': C.accent }),
      ]),
      svgEl('filter', { id: uid + 'gl', x: '-30%', y: '-30%', width: '160%', height: '160%' }, [
        svgEl('feGaussianBlur', { stdDeviation: 3, result: 'b' }),
        svgEl('feMerge', null, [svgEl('feMergeNode', { in: 'b' }), svgEl('feMergeNode', { in: 'SourceGraphic' })]),
      ]),
    ]))

    // sections
    const sg = []
    SECTIONS.forEach((s, i) => {
      const xa = x(s.a), xb = x(s.b)
      if (i === 1) sg.push(svgEl('rect', { x: xa, y: plotT, width: xb - xa, height: plotB - plotT, fill: 'rgba(130,165,225,.025)' }))
      if (i > 0) sg.push(svgEl('line', { x1: xa, y1: plotT, x2: xa, y2: plotB, stroke: 'rgba(255,255,255,.07)', 'stroke-width': 1, 'stroke-dasharray': '2 6' }))
      if (!mob) sg.push(svgEl('text', { x: (xa + xb) / 2, y: plotT + 13, 'text-anchor': 'middle', 'font-size': 10, 'letter-spacing': '0.13em', 'font-family': MONO, fill: 'rgba(150,166,196,.42)', text: s.t }))
    })
    kids.push(svgEl('g', { style: `opacity:${rv ? 1 : 0};transition:opacity .9s ease .5s` }, sg))

    // grid
    const g = []
      ;[2000, 1000, 0].forEach((v) => {
        const gy = y(v)
        g.push(svgEl('line', { x1: ML, y1: gy, x2: plotR, y2: gy, stroke: v === 0 ? 'rgba(255,255,255,.16)' : 'rgba(255,255,255,.05)', 'stroke-width': v === 0 ? 1.2 : 1, 'stroke-dasharray': v === 0 ? null : '2 7' }))
        g.push(svgEl('text', { x: ML - 12, y: gy + 4, 'text-anchor': 'end', 'font-size': mob ? 27 : 11, 'font-family': MONO, fill: C.inkDim, text: v >= 1000 ? ('+$' + (v / 1000) + 'k') : (v > 0 ? ('+$' + v) : '$0') }))
      })
    kids.push(svgEl('g', null, g))

    // gap fill + lines. Built plain here; the draw-on (dash offset / fade) is
    // applied after insertion in render() via applyDraw(), so the transition
    // actually plays (a freshly-created node can't transition from nothing).
    gapEl = svgEl('path', { d: gp, fill: `url(#${uid}gap)` })
    lineWithout = svgEl('path', { d: withoutPath, fill: 'none', stroke: C.without, 'stroke-width': mob ? 5 : 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })
    lineWith = svgEl('path', { d: withPath, fill: 'none', stroke: `url(#${uid}ln)`, 'stroke-width': mob ? 7.5 : 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', filter: `url(#${uid}gl)` })
    kids.push(gapEl, lineWithout, lineWith)

    // end points + labels
    const ep = []
    ep.push(svgEl('circle', { cx: wpts[LAST][0], cy: wpts[LAST][1], r: 4.5 * k, fill: C.accent, stroke: C.bg, 'stroke-width': 2 }))
    ep.push(svgEl('text', { x: wpts[LAST][0] - (mob ? 16 : 10), y: wpts[LAST][1] + 2, 'text-anchor': 'end', 'font-size': mob ? 28 : 13, 'font-weight': 700, 'font-family': MONO, fill: C.accentBright, text: fmt(WITH[LAST]) }))
    ep.push(svgEl('circle', { cx: opts[LAST][0], cy: opts[LAST][1], r: 4 * k, fill: C.without, stroke: C.bg, 'stroke-width': 2 }))
    ep.push(svgEl('text', { x: opts[LAST][0] - (mob ? 16 : 10), y: opts[LAST][1] + (mob ? 32 : 16), 'text-anchor': 'end', 'font-size': mob ? 26 : 12, 'font-weight': 600, 'font-family': MONO, fill: '#8089a0', text: fmt(WITHOUT[LAST]) }))
    // Hidden until the draw-on finishes (applyDraw fades it in at the end);
    // built visible once drawn / under reduced motion.
    const decorShown = (rv && state.drawn) || reduced
    epGroup = svgEl('g', { style: `opacity:${decorShown ? 1 : 0}` }, ep)
    kids.push(epGroup)

    // markers
    const mk2 = []
    BEATS.forEach((b, i) => {
      const yval = b.onWith === false ? WITHOUT[b.wk] : WITH[b.wk]
      const mx = x(b.wk), my = y(yval)
      const active = activeIdx === i
      const t = /RESOLVE/.test(b.tag) ? 'resolve' : /EXIT|ALERT/.test(b.tag) ? 'sell' : /OPEN|ADD/.test(b.tag) ? 'buy' : 'hold'
      const col = t === 'buy' ? C.buy : t === 'sell' ? C.sell : t === 'resolve' ? C.resolve : C.hold
      const parts = []
      if (t === 'hold') {
        parts.push(svgEl('circle', { cx: mx, cy: my, r: (active ? 5 : 3.5) * k, fill: active ? col : C.bg, stroke: col, 'stroke-width': 1.5 * k }))
      } else {
        if (active) parts.push(svgEl('circle', { cx: mx, cy: my, r: 13 * k, fill: 'rgba(87,157,255,.10)', stroke: 'rgba(87,157,255,.4)', 'stroke-width': 1 * k }))
        const r = (active ? 10 : 8) * k
        parts.push(svgEl('circle', { cx: mx, cy: my, r, fill: active ? col : C.bg, stroke: col, 'stroke-width': (active ? 2 : 1.6) * k }))
        const s = (active ? 4.2 : 3.3) * k, gc = active ? C.bg : col, sw = (active ? 1.9 : 1.6) * k
        let d
        if (t === 'buy') d = 'M' + (mx - s) + ' ' + (my + s * 0.55) + ' L' + mx + ' ' + (my - s * 0.55) + ' L' + (mx + s) + ' ' + (my + s * 0.55)
        else if (t === 'sell') d = 'M' + (mx - s) + ' ' + (my - s * 0.55) + ' L' + mx + ' ' + (my + s * 0.55) + ' L' + (mx + s) + ' ' + (my - s * 0.55)
        else d = 'M' + (mx - s) + ' ' + my + ' L' + (mx - s * 0.15) + ' ' + (my + s * 0.7) + ' L' + (mx + s) + ' ' + (my - s * 0.7)
        parts.push(svgEl('path', { d, fill: 'none', stroke: gc, 'stroke-width': sw, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }))
      }
      mk2.push(svgEl('g', { style: `opacity:${decorShown ? 1 : 0}` }, parts))
    })
    markerEls = mk2
    kids.push(svgEl('g', null, mk2))

    // scrubber
    if (mode !== 'overall') {
      const sx = x(ewf)
      const wy = y(interpAt(WITH, ewf)), oy = y(interpAt(WITHOUT, ewf))
      const sc = [
        svgEl('line', { x1: sx, y1: plotT, x2: sx, y2: plotB, stroke: 'rgba(255,255,255,.2)', 'stroke-width': mob ? 2.5 : 1, 'stroke-dasharray': '3 4' }),
        svgEl('circle', { cx: sx, cy: oy, r: 4.5 * k, fill: C.without, stroke: C.bg, 'stroke-width': 2 * k }),
      ]
      if (showPnl) {
        sc.push(svgEl('circle', { cx: sx, cy: wy, r: 7.5 * k, fill: '#0e1420', stroke: C.accentBright, 'stroke-width': 2 * k }))
        sc.push(svgEl('circle', { cx: sx, cy: wy, r: 3.2 * k, fill: C.accent }))
        if (!mob) {
          const bw = 184, bh = 82
          let bx = sx - bw / 2
          bx = Math.max(ML + 4, Math.min(plotR - bw - 4, bx))
          let by = wy - bh - 18
          if (by < plotT + 4) by = oy + 18
          const aheadW = w >= wo
          const pwCol = w === wo ? C.accentBright : aheadW ? C.pos : C.neg
          const pwoCol = w === wo ? C.accentBright : aheadW ? C.neg : C.pos
          sc.push(svgEl('g', { transform: `translate(${bx},${by})` }, [
            svgEl('rect', { x: 0, y: 0, width: bw, height: bh, rx: 13, fill: 'rgba(10,14,22,.96)', stroke: 'rgba(87,157,255,.5)' }),
            svgEl('text', { x: 16, y: 22, 'font-size': 9.5, 'letter-spacing': '0.13em', 'font-family': MONO, fill: '#6b7488', text: 'YOUR P&L HERE' }),
            svgEl('circle', { cx: 20, cy: 43, r: 3.6, fill: C.accent }),
            svgEl('text', { x: 31, y: 47, 'font-size': 13, 'font-family': SANS, fill: '#c2cad9', text: 'With Pulse' }),
            svgEl('text', { x: bw - 16, y: 47, 'text-anchor': 'end', 'font-size': 14.5, 'font-weight': 700, 'font-family': MONO, fill: pwCol, text: fmt(w) }),
            svgEl('circle', { cx: 20, cy: 65, r: 3.6, fill: C.without }),
            svgEl('text', { x: 31, y: 69, 'font-size': 13, 'font-family': SANS, fill: '#c2cad9', text: 'Without' }),
            svgEl('text', { x: bw - 16, y: 69, 'text-anchor': 'end', 'font-size': 14.5, 'font-weight': 700, 'font-family': MONO, fill: pwoCol, text: fmt(wo) }),
          ]))
        }
      } else {
        sc.push(svgEl('circle', { cx: sx, cy: wy, r: 5 * k, fill: C.accent, stroke: C.bg, 'stroke-width': 2 * k }))
      }
      // Advantage multiplier badge, centered between the two points — shown once
      // With-Pulse is far enough ahead and there's vertical room to fit it.
      const wv = interpAt(WITH, ewf), wov = interpAt(WITHOUT, ewf)
      const mult = wov > 0 ? wv / wov : Infinity
      const bh = mob ? 40 : 26
      if (wv > 0 && wov > 0 && mult >= MULTIPLIER_THRESHOLD && Math.abs(oy - wy) >= bh + 12) {
        const my = (wy + oy) / 2
        const label = (mult >= 10 ? Math.round(mult) : mult.toFixed(1)) + '×'
        const bw = mob ? 86 : 54
        sc.push(svgEl('g', { transform: `translate(${sx},${my})` }, [
          svgEl('rect', { x: -bw / 2, y: -bh / 2, width: bw, height: bh, rx: bh / 2, fill: 'rgba(8,12,20,.94)', stroke: 'rgba(87,157,255,.55)', 'stroke-width': mob ? 1.6 : 1 }),
          svgEl('text', { x: 0, y: mob ? 8 : 5, 'text-anchor': 'middle', 'font-size': mob ? 24 : 15, 'font-weight': 700, 'font-family': MONO, fill: C.accentBright, text: label }),
        ]))
      }
      kids.push(svgEl('g', null, sc))
    }

    // capture rect
    kids.push(svgEl('rect', { x: ML, y: plotT, width: plotR - ML, height: plotB - plotT, fill: 'transparent' }))

    const svg = svgEl('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      style: 'display:block;width:100%;height:auto;cursor:crosshair;touch-action:pan-y',
    }, kids)
    svg.addEventListener('mouseenter', handleEnter)
    svg.addEventListener('mousemove', handleMove)
    svg.addEventListener('mouseleave', handleLeave)
    svg.addEventListener('touchstart', handleTouch, { passive: true })
    svg.addEventListener('touchmove', handleTouch, { passive: true })
    svg.addEventListener('touchend', handleTouchEnd)
    return svg
  }

  // ---- interaction ----
  function weekFromEvent(clientX, target) {
    const r = target.getBoundingClientRect()
    const vbX = (clientX - r.left) / r.width * W
    let wk = Math.round((vbX - ML) / ((W - MR) - ML) * LAST)
    return Math.max(0, Math.min(LAST, wk))
  }
  function handleEnter() { inGraph = true; clearIdle(); if (state.playing) stopPlay() }
  function handleMove(e) {
    inGraph = true; clearIdle(); if (state.playing) stopPlay()
    const wk = weekFromEvent(e.clientX, e.currentTarget)
    if (wk !== state.hover) { state.hover = wk; render() }
  }
  function handleLeave() {
    inGraph = false
    if (state.hover !== null) { state.hover = null; render() }
    scheduleIdle(TIMING.idleRestartSec)
  }
  function handleTouch(e) {
    if (!e.touches || !e.touches[0]) return
    inGraph = true; if (state.playing) stopPlay(); clearIdle()
    const wk = weekFromEvent(e.touches[0].clientX, e.currentTarget)
    if (wk !== state.hover) { state.hover = wk; render() }
  }
  function handleTouchEnd() {
    inGraph = false
    if (state.hover !== null) { state.hover = null; render() }
    scheduleIdle(TIMING.idleRestartSec)
  }

  // ---- autoplay ----
  function readMs(b) {
    const wc = (s) => (s ? s.trim().split(/\s+/).length : 0)
    const words = wc(b.title) + wc(b.detail) + wc(b.down)
    return Math.max(TIMING.minCardMs, Math.min(TIMING.maxCardMs, words / (TIMING.readingWpm / 60) * 1000 + 500))
  }
  function buildSegs() {
    const segs = []
    segs.push({ type: 'pause', to: BEATS[0].wk, dur: readMs(BEATS[0]) })
    for (let i = 1; i < BEATS.length; i++) {
      segs.push({ type: 'sweep', from: BEATS[i - 1].wk, to: BEATS[i].wk, dur: Math.max(TIMING.sweepMinMs, Math.min(TIMING.sweepMaxMs, Math.abs(BEATS[i].wk - BEATS[i - 1].wk) * TIMING.sweepMsPerWeek)) })
      segs.push({ type: 'pause', to: BEATS[i].wk, dur: readMs(BEATS[i]) })
    }
    return segs
  }
  // Locate the timeline segment containing `elapsed`, with its start offset.
  function segAt(elapsed) {
    let acc = 0
    for (const s of playSegs) { if (elapsed < acc + s.dur) return { seg: s, start: acc }; acc += s.dur }
    const last = playSegs[playSegs.length - 1]
    return { seg: last, start: playTotal - last.dur }
  }
  function tick() {
    const elapsed = performance.now() - playT0
    if (elapsed >= playTotal) { stopPlay(); scheduleIdle(TIMING.idleRestartSec); return }
    const { seg, start } = segAt(elapsed)
    const segEl = elapsed - start
    let wk
    if (seg.type === 'pause') {
      wk = seg.to
      if (barFill) barFill.style.width = Math.min(100, (segEl / seg.dur) * 100).toFixed(1) + '%'
    } else {
      const p = segEl / seg.dur
      const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2
      wk = seg.from + (seg.to - seg.from) * e
    }
    if (Math.abs(wk - state.playWeek) > 0.02) { state.playWeek = wk; render() }
    // A pause was requested mid-transition: now that the sweep has landed on the
    // next beat (a 'pause' segment), freeze there — resume replays its read time.
    if (pausePending && seg.type === 'pause') { state.playWeek = seg.to; commitPause(start) }
  }
  // Start playback — resume from a button-pause if one is pending, else from the top.
  function play() {
    if (state.playing) return
    clearIdle() // cancel any pending idle-restart so it can't double-start or undo a later pause
    if (!(state.paused && playSegs && playElapsed < playTotal)) {
      playSegs = buildSegs()
      playTotal = playSegs.reduce((a, s) => a + s.dur, 0)
      playElapsed = 0
      state.playWeek = BEATS[0].wk
    }
    pausePending = false
    playT0 = performance.now() - playElapsed
    state.playing = true; state.paused = false; state.hover = null
    render()
    playIv = setInterval(tick, 40)
  }
  // Freeze playback at `elapsedMs` into the timeline, remembering the spot so the
  // next play() resumes from there.
  function commitPause(elapsedMs) {
    playElapsed = elapsedMs
    pausePending = false
    clearIdle() // a button-pause is sticky — no pending idle should silently resume it
    if (playIv) { clearInterval(playIv); playIv = null }
    state.playing = false; state.paused = true
    render()
  }
  // Button-pause. If a pause is already queued, this click cancels it (keep
  // playing). On a beat → freeze immediately. Mid-sweep → queue the pause and
  // show feedback now; tick commits it once the sweep lands on the next beat.
  function pausePlay() {
    if (!state.playing) return
    if (pausePending) { pausePending = false; render(); return }
    const { seg } = segAt(performance.now() - playT0)
    if (seg.type === 'sweep') { pausePending = true; render(); return }
    commitPause(performance.now() - playT0)
  }
  // Hard stop (hover interrupt / end of run): discard resume progress so the
  // next play() starts fresh from the top.
  function stopPlay() {
    if (playIv) { clearInterval(playIv); playIv = null }
    playElapsed = 0
    pausePending = false
    const wasActive = state.playing || state.paused
    state.playing = false; state.paused = false
    if (wasActive) render()
  }
  function scheduleIdle(sec, extra) {
    if (reduced) return
    if (idleTimer) clearTimeout(idleTimer)
    idleTimer = setTimeout(() => {
      // Don't auto-resume a button-paused chart — pause stays until Play is clicked.
      if (!inGraph && !state.playing && !state.paused) play()
    }, Math.max(0, sec) * 1000 + (extra || 0))
  }
  function clearIdle() { if (idleTimer) { clearTimeout(idleTimer); idleTimer = null } }

  // ---- responsive ----
  let resizeRaf = 0
  window.addEventListener('resize', () => {
    if (resizeRaf) return
    resizeRaf = requestAnimationFrame(() => {
      resizeRaf = 0
      const m = detectMobile()
      if (m !== state.isMobile) { state.isMobile = m; render() }
    })
  })

  // ---- boot ----
  render()
  if (reduced) {
    state.revealed = true
    render()
  }
  return {
    // The play/pause control — main.js relocates this next to the page's
    // "See The Difference" title.
    playButton: playBtn,
    reveal() {
      if (state.revealed) return
      state.revealed = true
      render()
      scheduleIdle(TIMING.autoStartDelaySec, 1800)
    },
    // Start the walkthrough now (no idle wait). No-op if already playing.
    play() {
      if (!state.revealed) { state.revealed = true; render() }
      if (!state.playing) play()
    },
  }
}
