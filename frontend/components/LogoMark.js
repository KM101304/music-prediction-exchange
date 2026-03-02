export function LogoMark({ className = 'h-8 w-8' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="mpxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="14" fill="#0f172a" stroke="#334155" strokeWidth="2" />
      <path
        d="M20 42V22c0-1.657 1.343-3 3-3h1.2c.562 0 1.112.158 1.588.456L38 26.5V22c0-1.657 1.343-3 3-3h.6c1.657 0 3 1.343 3 3v20c0 1.657-1.343 3-3 3H41c-.593 0-1.173-.176-1.667-.505L26 37.2V42c0 1.657-1.343 3-3 3h0c-1.657 0-3-1.343-3-3Z"
        fill="url(#mpxGrad)"
      />
      <circle cx="21" cy="18" r="3" fill="#22d3ee" />
      <circle cx="43" cy="46" r="3" fill="#86efac" />
    </svg>
  );
}
