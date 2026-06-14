import type { RefObject } from 'react'

type Props = {
  /** Shared ref to the trailer element so the top-bar's mute button can drive it. */
  videoRef: RefObject<HTMLVideoElement>
}

/**
 * Landing hero: the Pulse trailer embedded so it reads as part of the page, not
 * a video dropped on top of it. The trailer is rendered on pure black, so we sit
 * it inside a black field that feathers out to the site's bg-deep, and we mask
 * the video's own edges to transparency — the rectangular boundary dissolves and
 * the footage looks like it's living in the same dark space as the rest of the
 * site. The sound toggle lives in the top bar (it shares videoRef).
 */
export default function TrailerHero({ videoRef }: Props) {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-bg-deep">
      {/* Pure black field the trailer melts into — it shares the video's own
          black background so the footage has no visible boundary. */}
      <div className="absolute inset-0 bg-black" />

      {/* Ambient accent glow, same visual language as the showcases. */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[44vh] w-[64vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent opacity-[0.07] blur-[130px]" />

      {/* One tall, eased fade carries the black field smoothly down into bg-deep
          so the hero dissolves into the showcase with no seam. The mid stops
          curve the ramp so there's no perceptible line where black meets blue. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[62vh] bg-[linear-gradient(to_bottom,transparent_0%,rgba(7,11,18,0.15)_30%,rgba(7,11,18,0.55)_60%,var(--color-bg-deep)_100%)]" />

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

      {/* Quiet scroll cue. */}
      <div className="pointer-events-none absolute bottom-8 left-1/2 z-20 -translate-x-1/2 text-[11px] tracking-[2px] text-fg-dim">
        SCROLL
      </div>
    </section>
  )
}
