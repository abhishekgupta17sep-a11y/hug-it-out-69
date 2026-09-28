export function Logo({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="wn-sun" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--accent)" />
          <stop offset="1" stopColor="oklch(0.72 0.17 50)" />
        </linearGradient>
        <linearGradient id="wn-cloud" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="oklch(0.99 0 0)" />
          <stop offset="1" stopColor="oklch(0.88 0.03 230)" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="12" fill="var(--primary)" />
      <circle cx="15" cy="15" r="7" fill="url(#wn-sun)" />
      <path d="M12 30a6 6 0 0 1 1-11.9A8 8 0 0 1 28.5 20 5 5 0 0 1 28 30Z" fill="url(#wn-cloud)" />
    </svg>
  );
}
