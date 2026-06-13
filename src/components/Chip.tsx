export default function Chip({
  label,
  className = '',
}: {
  label: string
  className?: string
}) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border border-glass-border-soft bg-glass px-4 py-2 backdrop-blur-sm ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
      <span className="font-body text-xs font-semibold tracking-[1.5px] text-fg-muted">
        {label}
      </span>
    </div>
  )
}
