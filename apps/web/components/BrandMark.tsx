// The brand mark: an Outcome Label card with ranked rows and a check.
// app/icon.svg is the same drawing with fixed colors, for the browser icon; keep the two in step.

export interface BrandMarkColors {
  primary: string
  // The ranked rows.
  muted: string
  // The card and the cut-out ring around the check.
  surface: string
  // The check mark.
  onPrimary: string
}

// Theme colors, so the mark follows light and dark mode.
const themeColors: BrandMarkColors = {
  primary: "hsl(var(--primary))",
  muted: "hsl(var(--primary) / 0.5)",
  surface: "hsl(var(--background))",
  onPrimary: "hsl(var(--primary-foreground))",
}

// Fixed colors, for images rendered without the site's CSS (social-sharing images).
export const fixedBrandMarkColors: BrandMarkColors = {
  primary: "#694CFA",
  muted: "#B3A5FD",
  surface: "#FFFFFF",
  onPrimary: "#FFFFFF",
}

// size sets the width and height attributes, which image renderers without CSS need.
export function BrandMark({
  className,
  colors = themeColors,
  size,
}: {
  className?: string
  colors?: BrandMarkColors
  size?: number
}) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true" focusable="false">
      <rect x="9" y="5" width="40" height="52" rx="6" fill={colors.surface} stroke={colors.primary} strokeWidth="4" />
      <rect x="16" y="13" width="26" height="6" rx="2" fill={colors.primary} />
      <rect x="16" y="25" width="24" height="4.5" rx="2.25" fill={colors.muted} />
      <rect x="16" y="34" width="18" height="4.5" rx="2.25" fill={colors.muted} />
      <rect x="16" y="43" width="12" height="4.5" rx="2.25" fill={colors.muted} />
      <circle cx="47" cy="47" r="12" fill={colors.primary} stroke={colors.surface} strokeWidth="3" />
      <polyline
        points="41.5,47 45.5,51 52.5,43.5"
        fill="none"
        stroke={colors.onPrimary}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
