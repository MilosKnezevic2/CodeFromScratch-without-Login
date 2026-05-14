/**
 * Brand asset renderer — returns PNG variants of the wordmark / favicon.
 *
 * Endpoints:
 *   /api/brand/favicon-32         → 32x32 PNG favicon (bars)
 *   /api/brand/favicon-48         → 48x48 PNG favicon (bars)
 *   /api/brand/favicon-192        → 192x192 PNG (PWA)
 *   /api/brand/favicon-512        → 512x512 PNG (PWA splash)
 *   /api/brand/apple-touch-icon   → 180x180 PNG (iOS home screen)
 *   /api/brand/og                 → 1200x630 PNG (Open Graph default)
 *   /api/brand/wordmark-dark      → 1600x600 wordmark on dark
 *   /api/brand/wordmark-light     → 1600x600 wordmark on light
 *
 * All are generated with Satori (next/og) at runtime; the export script
 * fetches each one and writes static files to public/brand/.
 */
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

const FRAUNCES_BOLD =
  "https://cdn.jsdelivr.net/npm/@fontsource/fraunces@5/files/fraunces-latin-700-normal.woff";
const FRAUNCES_ITALIC =
  "https://cdn.jsdelivr.net/npm/@fontsource/fraunces@5/files/fraunces-latin-400-italic.woff";

const DARK_BG = "#0a0a0a";
const LIGHT_BG = "#f5f1e8";
const FG_ON_DARK = "#f5f1e8";
const FG_ON_LIGHT = "#0a0a0a";
const ACCENT = "#2dd4bf";

async function loadFont(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch font: ${url} → ${res.status}`);
  return res.arrayBuffer();
}

/**
 * Wordmark favicon — full CODE / from / SCRATCH stack inside a dark
 * rounded square. Unit size is computed from the canvas so the wordmark
 * fits with breathing room on the sides at every favicon size. At 32×32
 * the letters are necessarily tiny but the shape is preserved; on 192+
 * the wordmark is fully legible.
 */
function WordmarkFavicon({ size }: { size: number }) {
  // "SCRATCH" with tracking 0.14em is the widest line; ~5.2 * unit wide.
  // Solve for unit so the wordmark fits inside the square with ~8%
  // horizontal padding on each side.
  const unit = (size * 0.84) / 5.2;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: size,
        height: size,
        backgroundColor: DARK_BG,
        borderRadius: size * 0.18,
      }}
    >
      <ImprintStack fg={FG_ON_DARK} accent={ACCENT} unit={unit} />
    </div>
  );
}

/**
 * Imprint stack wordmark — full editorial mark with italic "from" + fleuron.
 * `unit` controls overall scale; everything sizes from it.
 */
function ImprintStack({
  fg,
  accent,
  unit,
}: {
  fg: string;
  accent: string;
  unit: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily: "Fraunces",
        lineHeight: 0.95,
      }}
    >
      <span
        style={{
          fontWeight: 700,
          fontStyle: "normal",
          letterSpacing: `${unit * 0.14}px`,
          color: fg,
          fontSize: unit,
        }}
      >
        CODE
      </span>
      <span
        style={{
          fontWeight: 400,
          fontStyle: "italic",
          letterSpacing: `${unit * 0.02}px`,
          color: accent,
          fontSize: unit,
          marginTop: unit * 0.1,
          marginBottom: unit * 0.1,
        }}
      >
        from
      </span>
      <span
        style={{
          fontWeight: 700,
          fontStyle: "normal",
          letterSpacing: `${unit * 0.14}px`,
          color: fg,
          fontSize: unit,
        }}
      >
        SCRATCH
      </span>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: unit * 0.16,
          marginTop: unit * 0.25,
        }}
      >
        <div
          style={{
            width: unit * 0.3,
            height: Math.max(1, unit * 0.04),
            backgroundColor: accent,
          }}
        />
        <div
          style={{
            width: unit * 0.12,
            height: unit * 0.12,
            borderRadius: "50%",
            backgroundColor: accent,
          }}
        />
        <div
          style={{
            width: unit * 0.3,
            height: Math.max(1, unit * 0.04),
            backgroundColor: accent,
          }}
        />
      </div>
    </div>
  );
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ variant: string }> },
) {
  const { variant } = await params;

  // Every variant now needs Fraunces — favicons render letters too.
  const fonts = await Promise.all([
    loadFont(FRAUNCES_BOLD).then((data) => ({
      name: "Fraunces",
      data,
      weight: 700 as const,
      style: "normal" as const,
    })),
    loadFont(FRAUNCES_ITALIC).then((data) => ({
      name: "Fraunces",
      data,
      weight: 400 as const,
      style: "italic" as const,
    })),
  ]);

  // ── Favicon sizes (bars design) ──────────────────────────────────────
  const faviconSizes: Record<string, number> = {
    "favicon-16": 16,
    "favicon-32": 32,
    "favicon-48": 48,
    "favicon-192": 192,
    "favicon-512": 512,
    "apple-touch-icon": 180,
  };

  if (variant in faviconSizes) {
    const size = faviconSizes[variant]!;
    return new ImageResponse(<WordmarkFavicon size={size} />, {
      width: size,
      height: size,
      fonts,
    });
  }

  // ── Open Graph 1200×630 — wordmark + tagline + accent orbs ────────────
  if (variant === "og") {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            height: "100%",
            backgroundColor: DARK_BG,
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -120,
              right: -80,
              width: 460,
              height: 460,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(45,212,191,0.25) 0%, rgba(45,212,191,0) 70%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -100,
              left: -60,
              width: 360,
              height: 360,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(34,211,238,0.18) 0%, rgba(34,211,238,0) 70%)",
            }}
          />
          <ImprintStack fg={FG_ON_DARK} accent={ACCENT} unit={90} />
          <div
            style={{
              marginTop: 60,
              display: "flex",
              fontFamily: "Fraunces",
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: 26,
              color: "rgba(245,241,232,0.6)",
              letterSpacing: "0.02em",
            }}
          >
            A weekly journal of practical web-development writing.
          </div>
        </div>
      ),
      { width: 1200, height: 630, fonts },
    );
  }

  // ── Wordmark on dark, 1600×600 (for embeds, footer, etc) ─────────────
  if (variant === "wordmark-dark") {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            height: "100%",
            backgroundColor: DARK_BG,
          }}
        >
          <ImprintStack fg={FG_ON_DARK} accent={ACCENT} unit={120} />
        </div>
      ),
      { width: 1600, height: 600, fonts },
    );
  }

  // ── Wordmark on light, 1600×600 ──────────────────────────────────────
  if (variant === "wordmark-light") {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            height: "100%",
            backgroundColor: LIGHT_BG,
          }}
        >
          <ImprintStack fg={FG_ON_LIGHT} accent={"#0d9488"} unit={120} />
        </div>
      ),
      { width: 1600, height: 600, fonts },
    );
  }

  return new Response(`Unknown variant: ${variant}`, { status: 404 });
}
