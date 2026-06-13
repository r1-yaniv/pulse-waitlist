import { useRef, useState } from 'react'
import Wordmark from '../components/Wordmark'

/**
 * Landing hero: the Pulse trailer embedded so it reads as part of the page, not
 * a video dropped on top of it. The trailer is rendered on pure black, so we sit
 * it inside a black field that feathers out to the site's bg-deep, and we mask
 * the video's own edges to transparency — the rectangular boundary dissolves and
 * the footage looks like it's living in the same dark space as the rest of the
 * site.
 */
export default function TrailerHero() {
  const videoRef = useRef<HTMLVideoElement>(null)
  // Autoplay requires the video to start muted; the toggle lets people opt in.
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
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-bg-deep">
      {/* Black field the trailer melts into, feathering out to bg-deep so the
          section blends into the showcase below it. */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_42%,#000000_0%,#000000_38%,var(--color-bg-deep)_100%)]" />

      {/* Ambient accent glow, same visual language as the showcases. */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[44vh] w-[64vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent opacity-[0.07] blur-[130px]" />

      {/* Resolve the black field to exactly bg-deep at the bottom edge so the
          hero merges into the showcase below with no hard seam. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[38vh] bg-[linear-gradient(to_bottom,transparent_0%,var(--color-bg-deep)_92%)]" />

      <Wordmark className="absolute top-[45px] left-[5.2vw] z-20" />

      {/* The trailer. Feathered edges (see .trailer-feather) erase the hard
          rectangle so it integrates with the surrounding black field. */}
      <div className="relative z-10 w-full">
        <video
          ref={videoRef}
          className="trailer-feather block aspect-video w-full"
          src={`${import.meta.env.BASE_URL}pulse-trailer.mp4`}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
      </div>

      {/* Gentle sound toggle. */}
      <button
        type="button"
        onClick={toggleMuted}
        aria-label={muted ? 'Unmute trailer' : 'Mute trailer'}
        aria-pressed={!muted}
        className="absolute top-[45px] right-[5.2vw] z-20 flex h-10 w-10 items-center justify-center rounded-full border border-glass-border bg-glass text-fg-muted backdrop-blur-md transition-colors duration-300 hover:border-accent hover:text-accent-bright"
      >
        {muted ? (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M11 4.7a.7.7 0 0 0-1.2-.5L6 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h3l3.8 3.8a.7.7 0 0 0 1.2-.5z" />
            <line x1="22" y1="9" x2="16" y2="15" />
            <line x1="16" y1="9" x2="22" y2="15" />
          </svg>
        ) : (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M11 4.7a.7.7 0 0 0-1.2-.5L6 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h3l3.8 3.8a.7.7 0 0 0 1.2-.5z" />
            <path d="M16 9a5 5 0 0 1 0 6" />
            <path d="M19.5 6.5a9 9 0 0 1 0 11" />
          </svg>
        )}
      </button>

      {/* Quiet scroll cue. */}
      <div className="pointer-events-none absolute bottom-8 left-1/2 z-20 -translate-x-1/2 text-[11px] tracking-[2px] text-fg-dim">
        SCROLL
      </div>
    </section>
  )
}
