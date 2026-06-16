import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import TopBar from './components/TopBar'
import TrailerHero from './sections/TrailerHero'
import Showcase from './sections/Showcase'
import Outro from './sections/Outro'
import WaitlistCTA from './components/WaitlistCTA'
import ShareModalCard from './components/ShareModalCard'
import { useWaitlist } from './lib/useWaitlist'
import type { Preference } from './lib/waitlist'

gsap.registerPlugin(ScrollTrigger)

// The URL bar showing/hiding on mobile fires resize events that re-run layout
// and re-measure every ScrollTrigger mid-gesture, which stutters the scroll.
// ignoreMobileResize stops that thrash without taking over scrolling itself.
ScrollTrigger.config({ ignoreMobileResize: true })

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
  poster: `${import.meta.env.BASE_URL}notif-reveal-poster.webp`,
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

  // Waitlist state shared by the CTA (form / "you are #N" pill) and the share
  // modal so both agree on uid, position and the live count.
  const { uid, status, count, join } = useWaitlist()

  // The share card stands in for the CTA while open. It opens automatically the
  // moment a join succeeds, and on demand when an already-joined visitor taps
  // their "you are #N" pill. It never auto-opens on load.
  const [shareOpen, setShareOpen] = useState(false)

  async function handleJoin(email: string, preference: Preference) {
    const res = await join(email, preference)
    setShareOpen(true)
    return res
  }

  function closeShare() {
    setShareOpen(false)
  }

  // Esc dismisses the share card (backdrop click is handled on the scrim).
  useEffect(() => {
    if (!shareOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeShare()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [shareOpen])

  return (
    <main className="relative">
      <TopBar muted={muted} onToggleMuted={toggleMuted} />
      <TrailerHero videoRef={videoRef} />
      <Showcase {...DISCOVERY} />
      <Outro />
      {/* The share card stands in for the CTA while open, so hide the floating
          pill. It returns when the card is dismissed. */}
      {!shareOpen && (
        <WaitlistCTA
          status={status}
          count={count}
          onSubmit={handleJoin}
          onOpenShare={() => setShareOpen(true)}
        />
      )}

      {shareOpen && status?.joined && (
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
            <ShareModalCard
              index={status.index}
              referralId={uid}
              origin={window.location.host}
            />
          </div>
        </div>
      )}
    </main>
  )
}
