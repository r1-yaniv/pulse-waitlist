import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const GEOMETRY =
  'M0 150l320 0 30-14 30 14 50 0 32-102 32 194 32-92 54 0 40-26 40 26 240 0'

/**
 * The EKG heartbeat line from the outro. Its draw is scrubbed to scroll:
 * it traces in as the user descends toward the page bottom (fully drawn at
 * max scroll) and retraces back when they scroll up.
 */
export default function PulseLine({ className = '' }: { className?: string }) {
  const svgRef = useRef<SVGSVGElement>(null)

  useLayoutEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    // Touch browsers throttle scroll *events* during momentum scrolling (the
    // page still scrolls smoothly via the compositor, but JS gets sparse
    // updates), so a scrubbed draw visibly trails the finger. On touch we draw
    // the line once as it enters view; on pointer devices we keep the scrubbed
    // trace tied to scroll.
    const touch = window.matchMedia('(pointer: coarse)').matches
    const ctx = gsap.context(() => {
      const paths = svg.querySelectorAll<SVGPathElement>('path')
      paths.forEach((path) => {
        const len = path.getTotalLength()
        gsap.fromTo(
          path,
          { strokeDasharray: len, strokeDashoffset: len },
          touch
            ? {
                strokeDashoffset: 0,
                duration: 1.1,
                ease: 'power2.out',
                scrollTrigger: { trigger: svg, start: 'top 80%', once: true },
              }
            : {
                strokeDashoffset: 0,
                ease: 'none',
                scrollTrigger: {
                  trigger: svg,
                  start: 'top bottom',
                  end: () => ScrollTrigger.maxScroll(window),
                  scrub: 0.4,
                  invalidateOnRefresh: true,
                },
              },
        )
      })
    }, svg)
    return () => ctx.revert()
  }, [])

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 900 300"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="pulse-stroke" x1="0" y1="0" x2="900" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--color-accent-soft)" />
          <stop offset="0.25" stopColor="var(--color-accent-bright)" />
          <stop offset="0.75" stopColor="var(--color-accent-bright)" />
          <stop offset="1" stopColor="var(--color-accent-soft)" />
        </linearGradient>
        <filter id="pulse-blur" x="-10%" y="-50%" width="120%" height="200%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>
      <path
        d={GEOMETRY}
        stroke="var(--color-accent)"
        strokeWidth="7"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.5"
        filter="url(#pulse-blur)"
        className="pulse-glow"
      />
      <path
        d={GEOMETRY}
        stroke="url(#pulse-stroke)"
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}
