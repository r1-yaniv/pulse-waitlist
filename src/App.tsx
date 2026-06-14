import { useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import TopBar from './components/TopBar'
import TrailerHero from './sections/TrailerHero'
import Showcase from './sections/Showcase'
import Outro from './sections/Outro'
import WaitlistCTA from './components/WaitlistCTA'

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

  return (
    <main>
      <TopBar muted={muted} onToggleMuted={toggleMuted} />
      <TrailerHero videoRef={videoRef} />
      <Showcase {...DISCOVERY} />
      <Outro />
      <WaitlistCTA />
    </main>
  )
}
