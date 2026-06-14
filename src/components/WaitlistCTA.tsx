import { useEffect, useRef, useState } from 'react'

type Choice = 'updates' | 'message'

/**
 * Floating waitlist CTA. Collapsed it's a compact accent pill ("join the
 * waitlist"); clicking morphs it — by width, with a springy ease — into a
 * Spotlight-style email bar. The action footer (two sticky, single-select
 * options) is shown the moment the bar opens, no typing required.
 *
 * The container keeps a constant border-radius and is promoted to its own
 * layer (translateZ) so the backdrop-blur stays clipped to the rounded shape
 * during the width animation — otherwise Chrome paints the blurred backdrop as
 * a hard rectangle mid-transition and the corners "pop" from square to round.
 */
export default function WaitlistCTA() {
  const [expanded, setExpanded] = useState(false)
  const [value, setValue] = useState('')
  const [choice, setChoice] = useState<Choice | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function close() {
    setExpanded(false)
    setValue('')
  }

  // Focus the field once the open morph is underway.
  useEffect(() => {
    if (!expanded) return
    const id = window.setTimeout(() => inputRef.current?.focus(), 180)
    return () => window.clearTimeout(id)
  }, [expanded])

  // Escape or an outside click collapses the bar back to the pill.
  useEffect(() => {
    if (!expanded) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    function onPointer(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointer)
    }
  }, [expanded])

  return (
    <div
      ref={rootRef}
      // Fixed: the pill always floats 7vh above the viewport bottom, never
      // anchoring into page flow. Spans the viewport width and centers the pill
      // via flex (left-0/right-0 give it the full width to center within).
      className="pointer-events-none fixed inset-x-0 bottom-[7vh] z-[60] flex justify-center max-md:bottom-[5vh]"
    >
      <div
        className={`pointer-events-auto relative overflow-hidden rounded-[26px] [transform:translateZ(0)] transition-[width,background-color,border-color,box-shadow] duration-500 ease-[cubic-bezier(0.34,1.4,0.5,1)] ${expanded
          ? 'w-[min(496px,92vw)] border border-accent/45 bg-[#101a2e]/70 shadow-[0_18px_60px_-12px_var(--color-shadow),0_0_40px_-12px_var(--color-glow)] backdrop-blur-xl'
          : 'w-[264px] cursor-pointer border border-transparent bg-accent/68 shadow-[0_12px_40px_-8px_var(--color-glow)] backdrop-blur-md hover:bg-accent/85 hover:shadow-[0_16px_52px_-8px_var(--color-glow)]'
          }`}
        onClick={() => {
          if (!expanded) setExpanded(true)
        }}
        role={expanded ? undefined : 'button'}
        tabIndex={expanded ? -1 : 0}
        aria-label={expanded ? undefined : 'Join the waitlist'}
        onKeyDown={(e) => {
          if (!expanded && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            setExpanded(true)
          }
        }}
      >
        {/* Morphing top region — collapsed label and expanded input cross-fade
            in the same band while the container width animates. */}
        <div className="relative h-[60px]">
          <div
            className={`absolute inset-0 flex items-center justify-center gap-2 transition-opacity duration-200 ${expanded ? 'pointer-events-none opacity-0' : 'opacity-100'
              }`}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-on-accent)"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" />
            </svg>
            <span className="font-body text-[16px] font-semibold text-on-accent">
              join the waitlist
            </span>
          </div>

          <form
            onSubmit={(e) => e.preventDefault()}
            className={`absolute inset-0 flex items-center gap-2 pr-2 pl-5 transition-opacity duration-300 ${expanded ? 'opacity-100 delay-100' : 'pointer-events-none opacity-0'
              }`}
          >
            <input
              ref={inputRef}
              type="email"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter your email to join the waitlist"
              className="min-w-0 flex-1 bg-transparent text-[16px] text-fg outline-none placeholder:text-fg-dim"
            />
            <button
              type="submit"
              aria-label="Join"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent transition-transform duration-200 hover:scale-105"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14" />
                <path d="m13 6 6 6-6 6" />
              </svg>
            </button>
          </form>
        </div>

        {/* Action footer — revealed as soon as the bar opens. Two single-select
            options; the choice is sticky and only changes on picking the other. */}
        <div
          className={`grid transition-all duration-300 ease-out ${expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
            }`}
        >
          <div className="overflow-hidden">
            <div className="flex items-center justify-end gap-2 border-t border-glass-border-soft px-3 py-2.5">
              <ChoiceButton selected={choice === 'updates'} onClick={() => setChoice('updates')}>
                send me updates
              </ChoiceButton>
              <ChoiceButton selected={choice === 'message'} onClick={() => setChoice('message')}>
                launch message only
              </ChoiceButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** A sticky, single-select footer option. Selected state is clearly shown. */
function ChoiceButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium whitespace-nowrap transition-colors duration-200 ${selected
        ? 'border-transparent bg-accent text-on-accent'
        : 'border-glass-border-soft text-fg-muted hover:bg-glass hover:text-fg'
        }`}
    >
      {children}
    </button>
  )
}
