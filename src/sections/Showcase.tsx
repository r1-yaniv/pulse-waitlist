import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import Chip from '../components/Chip'
import AppWindow from '../components/AppWindow'

export type ShowcaseProps = {
  tag: string
  heading: string
  body: string
  bullets: readonly string[]
  image: string
  imageAlt: string
  /** Embed the media as an autoplaying loop video instead of a static image. */
  video?: boolean
  /** Poster still for the video — also what session replay captures in its place. */
  poster?: string
  /** Which side the app window sits on. Sides alternate between showcases. */
  windowSide: 'left' | 'right'
  /** Renders the dunes separator over the bottom edge (last showcase). */
  withDunes?: boolean
}

function CheckBullet({ label }: { label: string }) {
  return (
    <li className="flex items-center gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft">
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>
      <span className="text-[15px] text-fg-muted">{label}</span>
    </li>
  )
}

export default function Showcase({
  tag,
  heading,
  body,
  bullets,
  image,
  imageAlt,
  video = false,
  poster,
  windowSide,
  withDunes = false,
}: ShowcaseProps) {
  const sectionRef = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const section = sectionRef.current
    if (!section) return
    // Touch browsers throttle scroll events during momentum, so scrubbed parallax
    // trails the finger and reads as lag. Skip the scroll-tied pans on touch (the
    // entrance fade below is a one-shot tween, so it stays).
    const touch = window.matchMedia('(pointer: coarse)').matches
    const ctx = gsap.context(() => {
      gsap.from('.sc-text > *', {
        opacity: 0,
        y: 36,
        stagger: 0.08,
        duration: 0.7,
        ease: 'power2.out',
        scrollTrigger: { trigger: section, start: 'top 62%' },
      })
      // The tall screenshot pans slowly inside its window as we scroll by.
      // A video carries its own motion, so it's left alone.
      if (!video && !touch) gsap.fromTo(
        '.sc-shot img',
        { y: 0 },
        {
          y: () => {
            const img = section.querySelector<HTMLImageElement>('.sc-shot img')
            const holder = section.querySelector<HTMLElement>('.sc-shot')
            if (!img || !holder) return 0
            return -(Math.max(0, img.scrollHeight - holder.clientHeight) * 0.4)
          },
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
            invalidateOnRefresh: true,
          },
        },
      )
      if (withDunes && !touch) {
        gsap.fromTo(
          '.sc-dunes',
          { y: '18%' },
          {
            y: '0%',
            ease: 'none',
            scrollTrigger: {
              trigger: section,
              start: 'center bottom',
              end: 'bottom bottom',
              scrub: true,
            },
          },
        )
      }
    }, section)
    return () => ctx.revert()
  }, [withDunes, video])

  const windowLeft = windowSide === 'left'

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-bg-deep py-[12vh] max-lg:py-[8vh]"
    >
      {/* Glow behind the window */}
      <div
        className={`absolute top-1/2 h-[600px] w-[900px] -translate-y-1/2 rounded-full bg-accent opacity-10 blur-[110px] ${
          windowLeft ? 'left-[-11vw]' : 'right-[-11vw]'
        }`}
      />
      <div
        className={`relative mx-auto flex max-w-[1440px] items-center gap-[4vw] px-[8.3vw] max-lg:flex-col ${
          windowLeft ? 'flex-row-reverse' : ''
        }`}
      >
        <div className="sc-text flex w-[430px] max-w-full shrink-0 flex-col gap-[22px]">
          <Chip label={tag} className="self-start" />
          <h2 className="font-display text-[clamp(28px,2.65vw,38px)] leading-[1.2] text-fg">
            {heading}
          </h2>
          <p className="text-base leading-[1.6] text-fg-muted">{body}</p>
          <ul className="flex flex-col gap-3.5">
            {bullets.map((b) => (
              <CheckBullet key={b} label={b} />
            ))}
          </ul>
        </div>
        <div
          className={`relative min-w-0 flex-1 ${
            windowLeft ? 'max-lg:order-first' : ''
          }`}
        >
          {/* Window bleeds off the outer edge like the mockup frames */}
          <AppWindow
            src={image}
            alt={imageAlt}
            video={video}
            poster={poster}
            className={`sc-shot h-auto w-[min(57vw,1080px)] max-lg:w-full lg:translate-y-[12vh] ${
              windowLeft ? 'float-right' : ''
            }`}
            imgClassName="h-auto will-change-transform"
          />
        </div>
      </div>
      {withDunes && (
        <div className="sc-dunes pointer-events-none absolute bottom-[-1px] left-0 z-10 h-[58%] w-full">
          <img
            src={`${import.meta.env.BASE_URL}scenery/dunes.png`}
            alt=""
            className="h-full w-full object-cover object-top"
          />
          {/* blend the cut edge of the image into the outro's bg-deep */}
          <div className="absolute inset-x-0 bottom-0 h-[35%] bg-[linear-gradient(to_bottom,transparent,var(--color-bg-deep))]" />
        </div>
      )}
    </section>
  )
}
