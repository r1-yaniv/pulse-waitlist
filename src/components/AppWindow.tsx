import { forwardRef } from 'react'

type Props = {
  src: string
  alt: string
  className?: string
  imgClassName?: string
  /** When set, an autoplaying loop video fills the window instead of an image. */
  video?: boolean
  /**
   * Still shown before the video plays. Also what session-replay tools
   * (OpenReplay) capture in place of the video, which they can't record.
   */
  poster?: string
}

/** Browser-chrome frame around a product screenshot (c/AppWindow in the mockup). */
const AppWindow = forwardRef<HTMLDivElement, Props>(function AppWindow(
  { src, alt, className = '', imgClassName = '', video = false, poster },
  ref,
) {
  return (
    <div
      ref={ref}
      className={`overflow-hidden rounded-2xl border border-glass-border bg-bg-deep shadow-[0_30px_70px_-10px_var(--color-shadow)] ${className}`}
    >
      <div className="flex h-[42px] items-center gap-2 border-b border-glass-border-soft bg-glass-strong px-4 md:backdrop-blur-md">
        <span className="h-2.5 w-2.5 rounded-full bg-glass-border" />
        <span className="h-2.5 w-2.5 rounded-full bg-glass-border" />
        <span className="h-2.5 w-2.5 rounded-full bg-glass-border" />
        <div className="flex-1" />
        <div className="flex items-center gap-1.5 rounded-full bg-glass px-4 py-1.5">
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-fg-dim)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span className="text-xs text-fg-dim">pulse.trade</span>
        </div>
        <div className="flex-1" />
      </div>
      {video ? (
        <video
          src={src}
          poster={poster}
          aria-label={alt}
          className={`block w-full object-cover object-top ${imgClassName}`}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
      ) : (
        <img
          src={src}
          alt={alt}
          className={`block w-full object-cover object-top ${imgClassName}`}
        />
      )}
    </div>
  )
})

export default AppWindow
