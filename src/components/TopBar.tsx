import Wordmark from './Wordmark'

type Props = {
  muted: boolean
  onToggleMuted: () => void
}

/**
 * Completely invisible top bar — no background, border or fill. It carries the
 * Pulse logo at the left and the trailer's sound toggle at the right, both on
 * the same baseline. It's fixed above every section so the brand mark stays put
 * as the page scrolls. pointer-events are disabled on the bar itself so it never
 * intercepts clicks over the content below; only the logo and button are live.
 */
export default function TopBar({ muted, onToggleMuted }: Props) {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex items-center justify-between px-[5.2vw] pt-[42px] pb-5 max-md:px-6">
      <Wordmark className="pointer-events-auto" />

      <button
        type="button"
        onClick={onToggleMuted}
        aria-label={muted ? 'Unmute trailer' : 'Mute trailer'}
        aria-pressed={!muted}
        className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-glass-border bg-glass text-fg-muted backdrop-blur-md transition-colors duration-300 hover:border-accent hover:text-accent-bright"
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
    </header>
  )
}
