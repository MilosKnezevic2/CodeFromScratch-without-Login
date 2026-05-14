import Link from "next/link";

/**
 * CodeFromScratch wordmark — editorial imprint stack v2.
 *
 * Refinements over v1:
 *  - Middle word "from" is set in Fraunces italic at lower weight, lowercase,
 *    in the accent colour — creates editorial rhythm instead of three notes
 *    in the same key. Italic + colour + case shift is the typographic
 *    signature.
 *  - WONK variable axis animates 0 → 1 on hover (custom class in globals.css)
 *    swapping in Fraunces' alternative wonky letterforms. Nearly nobody on
 *    the web uses variable-font axis animation in a logo.
 *  - The accent rule is replaced with a fleuron ornament — ━ • ━ — a classic
 *    publishing-house typographic mark used by Penguin, Faber, Granta.
 *  - SOFT axis raised on the italic so corner terminals soften, matching
 *    the warmer feel of italic glyphs.
 *
 * `variant="compact"` collapses to "C / f / S" for tight spaces.
 */
type LogoProps = {
  variant?: "stack" | "compact";
  className?: string;
  asLink?: boolean;
};

export default function Logo({
  variant = "stack",
  className = "",
  asLink = true,
}: LogoProps) {
  const isCompact = variant === "compact";

  const words = isCompact
    ? [
        { text: "C", italic: false },
        { text: "f", italic: true },
        { text: "S", italic: false },
      ]
    : [
        { text: "CODE", italic: false },
        { text: "from", italic: true },
        { text: "SCRATCH", italic: false },
      ];

  const sizeClass = isCompact
    ? "text-[12px]"
    : "text-[10px] sm:text-[11px]";

  const mark = (
    <span
      aria-hidden
      className="inline-flex select-none flex-col items-center leading-[0.95]"
      style={{
        fontFamily:
          "'Fraunces Variable', 'Fraunces', 'Cormorant Garamond', Georgia, serif",
      }}
    >
      {words.map((w, i) =>
        w.italic ? (
          <span
            key={`${w.text}-${i}`}
            className={`logo-wonk-italic ${sizeClass} text-accent`}
            style={{
              fontWeight: 400,
              fontStyle: "italic",
              letterSpacing: "0.02em",
              marginTop: isCompact ? "0.05em" : "0.1em",
              marginBottom: isCompact ? "0.05em" : "0.1em",
            }}
          >
            {w.text}
          </span>
        ) : (
          <span
            key={`${w.text}-${i}`}
            className={`${sizeClass} text-foreground transition-colors duration-300 group-hover:text-accent`}
            style={{
              fontWeight: 700,
              fontStyle: "normal",
              fontVariationSettings: "'opsz' 100, 'SOFT' 0, 'WONK' 0",
              letterSpacing: "0.14em",
            }}
          >
            {w.text}
          </span>
        ),
      )}
      {/* Fleuron ornament: short rule · centre dot · short rule.
          A classic publishing imprint signature. */}
      <span
        aria-hidden
        className="mt-2 flex items-center gap-1.5"
      >
        <span className="block h-px w-2.5 bg-accent transition-all duration-300 group-hover:w-3.5" />
        <span className="block h-1 w-1 rounded-full bg-accent transition-transform duration-300 group-hover:scale-125" />
        <span className="block h-px w-2.5 bg-accent transition-all duration-300 group-hover:w-3.5" />
      </span>
    </span>
  );

  const inner = (
    <>
      {mark}
      <span className="sr-only">CodeFromScratch</span>
    </>
  );

  if (!asLink) {
    return <span className={`group inline-block ${className}`}>{inner}</span>;
  }

  return (
    <Link
      href="/"
      aria-label="CodeFromScratch — home"
      className={`group inline-block rounded-sm ring-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${className}`}
    >
      {inner}
    </Link>
  );
}
