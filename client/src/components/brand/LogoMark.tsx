/* AM2050 — Modern Civic Tech Identity: Bold, minimalist, memorable AM2050 mark readable across all scales. */
type LogoMarkProps = {
  className?: string;
  size?: number;
  showDot?: boolean;
  theme?: "emerald" | "navy";
};

export function LogoMark({ className = "", size = 40, showDot = true, theme = "emerald" }: LogoMarkProps) {
  const isNavy = theme === "navy";
  const bgGradId = isNavy ? "am-bg-navy" : "am-bg-emerald";
  const borderGradId = isNavy ? "am-border-navy" : "am-border-emerald";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-label="AM2050 mark"
      role="img"
    >
      <defs>
        <linearGradient id="am-bg-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#064E3B" />
          <stop offset="100%" stopColor="#022C22" />
        </linearGradient>
        <linearGradient id="am-border-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#059669" stopOpacity="0.3" />
        </linearGradient>

        <linearGradient id="am-bg-navy" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0D283B" />
          <stop offset="100%" stopColor="#051522" />
        </linearGradient>
        <linearGradient id="am-border-navy" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#0284C7" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {/* Modern Badge Squircle */}
      <rect width="48" height="48" rx="12" fill={`url(#${bgGradId})`} />
      <rect x="1" y="1" width="46" height="46" rx="11" stroke={`url(#${borderGradId})`} strokeWidth="1.2" />

      {/* Signature Gold Accent Node (Top Right, JConnect inspired) */}
      {showDot && (
        <g>
          <circle cx="41" cy="7" r="4.2" fill="#F59E0B" stroke="#064E3B" strokeWidth="2" />
          <circle cx="41" cy="7" r="1.8" fill="#FEF3C7" />
        </g>
      )}

      {/* Bold Typographic AM (Top Row) */}
      <text
        x="24"
        y="23.5"
        textAnchor="middle"
        fontFamily="'Plus Jakarta Sans', 'Sora', 'Segoe UI', system-ui, sans-serif"
        fontWeight="800"
        fontSize="17.5"
        fill="#FFFFFF"
        letterSpacing="0.4"
      >
        AM
      </text>

      {/* Crisp 2050 Numerals (Bottom Row) */}
      <text
        x="24"
        y="38.5"
        textAnchor="middle"
        fontFamily="'IBM Plex Mono', 'Consolas', monospace"
        fontWeight="700"
        fontSize="10.5"
        fill={isNavy ? "#38BDF8" : "#6EE7B7"}
        letterSpacing="0.8"
      >
        2050
      </text>
    </svg>
  );
}
