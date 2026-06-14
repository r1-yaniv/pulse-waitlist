import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import PulseLine from '../components/PulseLine'

export default function Outro() {
  const sectionRef = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const section = sectionRef.current
    if (!section) return
    const ctx = gsap.context(() => {
      gsap.from('.outro-stack > *', {
        opacity: 0,
        y: 40,
        stagger: 0.12,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: { trigger: section, start: 'top 55%' },
      })
      // Giant wordmark surfaces from below as the outro arrives.
      gsap.from('.outro-wordmark', {
        y: 140,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'bottom bottom',
          scrub: true,
        },
      })
    }, section)
    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-screen flex-col items-center overflow-hidden bg-bg-deep pt-[23vh]"
    >
      <div className="dotmesh absolute top-0 left-0 h-[57vh] w-[43vw] opacity-18" />

      {/* Giant fading wordmark behind everything */}
      {/* flex-centered so the gsap y-tween never bakes the x-centering
          into a stale pixel transform */}
      <div
        aria-hidden="true"
        className="outro-wordmark pointer-events-none absolute inset-x-0 top-[56vh] flex justify-center select-none"
      >
        <span
          className="font-display whitespace-nowrap leading-[1.1] tracking-[1vw] text-transparent"
          style={{
            fontSize: 'clamp(180px, 34.7vw, 560px)',
            // cancel the trailing letter-space so the glyphs center optically
            marginRight: '-1vw',
            backgroundImage:
              'linear-gradient(to bottom, var(--color-fg-dim), var(--color-bg-deep))',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
          }}
        >
          pulse
        </span>
      </div>

      {/* EKG pulse line crossing the wordmark */}
      <div className="pointer-events-none absolute top-[60vh] left-1/2 w-[min(900px,96vw)] -translate-x-1/2">
        <div className="pulse-glow absolute top-1/2 left-1/2 h-[160px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent opacity-16 blur-[90px]" />
        <PulseLine className="relative w-full" />
      </div>

      <div className="outro-stack relative z-10 flex w-[min(900px,92vw)] flex-col items-center text-center">
        <h2 className="font-display text-[clamp(44px,5.4vw,78px)] leading-[1.12] text-fg">
          Get signals
          <br />
          from the noise.
        </h2>
      </div>

      <p className="absolute right-10 bottom-7 text-[11px] tracking-[1.5px] text-fg-dim max-md:right-1/2 max-md:translate-x-1/2">
        © 2026 · PULSE · BY ROOMONE
      </p>
    </section>
  )
}
