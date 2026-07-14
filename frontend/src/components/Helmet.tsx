// ARES mark — a Corinthian helmet with a crimson crest. Ported from the prototype.
export function Helmet({ size = 44 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 130" width={size} height={size * (48 / 44)} role="img" aria-label="ARES helmet">
      <defs>
        <linearGradient id="aresHelm" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2E93E6" /><stop offset="0.55" stopColor="#1e5fd0" /><stop offset="1" stopColor="#1B3B9B" />
        </linearGradient>
        <linearGradient id="aresCrest" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff4d6d" /><stop offset="1" stopColor="#DE0A45" />
        </linearGradient>
      </defs>
      <path d="M58 48 C 40 30 46 6 86 2 C 66 12 58 30 64 48 Z" fill="url(#aresCrest)" />
      <path d="M63 47 C 52 32 58 14 80 8 C 68 18 64 32 70 47 Z" fill="#ff5c78" opacity="0.5" />
      <rect x="49" y="42" width="22" height="9" rx="4.5" fill="#DE0A45" />
      <path d="M34 46 C 40 36 52 32 60 32 C 68 32 80 36 86 46 C 92 58 90 78 84 94 C 80 106 72 114 60 116 C 48 114 40 106 36 94 C 30 78 28 58 34 46 Z" fill="url(#aresHelm)" />
      <path d="M41 60 C 47 57 52 57 55 60 L 55 68 C 50 65 45 65 41 68 Z" fill="#0b1330" />
      <path d="M79 60 C 73 57 68 57 65 60 L 65 68 C 70 65 75 65 79 68 Z" fill="#0b1330" />
      <path d="M56 62 L 64 62 L 62 100 C 61 103 59 103 58 100 Z" fill="#0b1330" />
      <path d="M38 52 C 46 46 74 46 82 52" stroke="#7fbcf2" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.65" />
    </svg>
  )
}
