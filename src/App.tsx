import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import TrailerHero from './sections/TrailerHero'
import Showcase from './sections/Showcase'
import Outro from './sections/Outro'

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
  image: '/app/pulse-dashboard.png',
  imageAlt: 'Pulse dashboard — the feed of news and signals linked to your positions',
  windowSide: 'right',
  withDunes: true,
} as const

export default function App() {
  return (
    <main>
      <TrailerHero />
      <Showcase {...DISCOVERY} />
      <Outro />
    </main>
  )
}
