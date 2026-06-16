import { useState } from 'react'

/**
 * Share / "you're on the waitlist" modal card. A faithful build of the
 * `Share Modal Card` frame from `screens-for-waitlist-site.pen` — the product's
 * neutral-slate dark theme with the blue accent, Inter + JetBrains Mono. The
 * design's `d-*` tokens are pinned here as local constants (they don't exist in
 * the site's `@theme`).
 *
 * Fully parameterized: pass the waitlist `index`, the `referralId`, and an
 * `origin`. The Copy button copies the full share URL to the clipboard.
 */

// Design tokens from the .pen file (dark `appearance` theme, `d-*` set).
const C = {
  ink: '#DCE2EA',
  ink2: '#9FADBC',
  ink3: '#738496',
  panel: '#22272B',
  // Translucent variant of `panel` — lets the live scene bleed through behind
  // the card (paired with a backdrop blur) for a subtle glassy depth.
  panelGlass: 'rgba(34, 39, 43, 0.78)',
  panel2: '#282E33',
  border: '#2C333A',
  divider: '#2C333A',
  accent: '#579DFF',
  onAccent: '#1D2125',
  shadow: '#00000080',
  rSm: '6px',
  rLg: '14px',
} as const

// Use the site's existing body font (Chakra Petch) everywhere — the design's
// `d-font`/`d-mono` both map onto it here.
const FONT = 'var(--font-body)'

function LinkIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

type Props = {
  /** Waitlist position. Rendered as the hero number, comma-grouped. */
  index?: number
  /** The user's referral id — the `ref` query param of the share link. */
  referralId?: string
  /** Share-link host, e.g. "pulse.ai". Display omits the protocol; the copied
   *  URL includes `https://`. */
  origin?: string
}

export default function ShareModalCard({
  index = 11743,
  referralId = 'tzfstuxu',
  origin = 'pulse.ai',
}: Props) {
  const [copied, setCopied] = useState(false)

  const displayLink = `${origin}/?ref=${referralId}`
  const shareUrl = `https://${displayLink}`

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl)
    } catch {
      // Clipboard API can be blocked (insecure context / permissions). Fall
      // back to a hidden textarea + execCommand so the button still works.
      const ta = document.createElement('textarea')
      ta.value = shareUrl
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand('copy')
      } catch {
        /* nothing else to try */
      }
      document.body.removeChild(ta)
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div
      className="flex w-[448px] max-w-[92vw] flex-col items-center border p-12 max-sm:p-7"
      style={{
        fontFamily: FONT,
        background: C.panelGlass,
        backdropFilter: 'blur(20px) saturate(1.3)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.3)',
        borderColor: C.border,
        borderRadius: C.rLg,
        boxShadow: `0 20px 50px -8px ${C.shadow}`,
      }}
    >
      {/* Hero — eyebrow / position number / subtext */}
      <div className="flex w-full flex-col items-center gap-1.5">
        <span style={{ color: C.ink3, letterSpacing: '0.6px', fontWeight: 600 }} className="text-[18px]">
          YOU ARE
        </span>
        <span
          style={{
            color: C.ink,
            fontWeight: 700,
            letterSpacing: '-1px',
            lineHeight: 1.05,
            fontVariantNumeric: 'tabular-nums',
            fontSize: 'clamp(52px, 16vw, 75px)',
          }}
        >
          #{index.toLocaleString('en-US')}
        </span>
        <span style={{ color: C.ink2, letterSpacing: '0.5px' }} className="text-[22px]">
          on the waitlist
        </span>
      </div>

      {/* Thanks copy */}
      <div className="flex w-full flex-col items-center px-4 pt-7 pb-[18px]">
        <p
          className="max-w-[272px] text-center text-[16px] leading-[1.55]"
          style={{ color: C.ink2 }}
        >
          Thanks for joining Pulse — you're officially in. As one of our founding
          members, you'll unlock a set of exclusive perks when we launch.
        </p>
      </div>

      {/* Share section — divider + heading */}
      <div className="flex w-full flex-col items-center gap-[22px] pt-1.5 pb-[22px]">
        <div className="h-px w-full" style={{ background: C.divider }} />
        <h3 className="text-center text-[23px]" style={{ color: C.ink, fontWeight: 700 }}>
          Share your link for even more
        </h3>
      </div>

      {/* Referral row — link + copy button */}
      <div
        className="flex w-full items-center justify-between border py-2 pr-2 pl-5"
        style={{ background: C.panel2, borderColor: C.border, borderRadius: C.rSm }}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span style={{ color: C.ink3 }}>
            <LinkIcon />
          </span>
          <span
            className="truncate text-[13px]"
            style={{ color: C.ink2, letterSpacing: '0.3px' }}
          >
            {displayLink}
          </span>
        </div>
        <button
          type="button"
          onClick={copyLink}
          aria-label={copied ? 'Link copied' : 'Copy referral link'}
          className="flex shrink-0 items-center gap-2 px-[22px] py-3 transition-transform active:scale-95"
          style={{ background: C.accent, color: C.onAccent, borderRadius: C.rSm, fontWeight: 600 }}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
          <span className="text-[16px]">{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
    </div>
  )
}
