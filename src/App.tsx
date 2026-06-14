import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import TopBar from './components/TopBar'
import TrailerHero from './sections/TrailerHero'
import Showcase from './sections/Showcase'
import Outro from './sections/Outro'
import WaitlistCTA from './components/WaitlistCTA'
import ShareModalCard from './components/ShareModalCard'

gsap.registerPlugin(ScrollTrigger)

const DISCOVERY = {
  tag: '03 — DISCOVERY',
  heading: 'Your next position, found.',
  body: 'Browse every market across venues, search in plain English, and stack filters until the odds line up. The next trade is already out there — Pulse points at it.',
  bullets: [
    'Search markets in plain English',
    'Filter and compare across venues',
    'Spot the odds before the crowd',
  ],
  image: `${import.meta.env.BASE_URL}notif-reveal.mp4`,
  imageAlt: 'Pulse surfacing a live signal notification tied to your positions',
  video: true,
  windowSide: 'right',
  withDunes: false,
} as const

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null)
  // Autoplay requires the trailer to start muted; the top-bar toggle opts in.
  const [muted, setMuted] = useState(true)

  function toggleMuted() {
    const video = videoRef.current
    if (!video) return
    const next = !video.muted
    video.muted = next
    if (!next) void video.play()
    setMuted(next)
  }

  // DEBUG: show the Share Modal Card by visiting the site with `#share` in the
  // URL (e.g. localhost:5173/#share). Close, backdrop click, or Esc dismiss it.
  // Not wired to any real CTA yet — remove this block when integrating.
  const [showShare, setShowShare] = useState(
    () => typeof window !== 'undefined' && window.location.hash === '#share',
  )
  useEffect(() => {
    const sync = () => setShowShare(window.location.hash === '#share')
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])
  useEffect(() => {
    if (!showShare) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeShare()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [showShare])
  function closeShare() {
    setShowShare(false)
    if (window.location.hash === '#share') {
      history.replaceState(null, '', window.location.pathname + window.location.search)
    }
  }

  return (
    <main className="relative">
      <TopBar muted={muted} onToggleMuted={toggleMuted} />
      <TrailerHero videoRef={videoRef} />
      <Showcase {...DISCOVERY} />
      <Outro />
      {/* The share card stands in for the CTA while open, so hide the floating
          pill. It returns when the card is dismissed. */}
      {!showShare && <WaitlistCTA />}

      {showShare && (
        // Transparent (un-dimmed) scrim — the card floats over the live scene,
        // but the full-screen layer still catches clicks so clicking anywhere
        // outside the card dismisses it (and brings the CTA pill back). Esc
        // also dismisses.
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center p-4 pb-[6vh]"
          onClick={closeShare}
        >
          <div
            className="origin-bottom scale-[0.8]"
            onClick={(e) => e.stopPropagation()}
          >
            <ShareModalCard />
          </div>
        </div>
      )}
    </main>
  )
}
