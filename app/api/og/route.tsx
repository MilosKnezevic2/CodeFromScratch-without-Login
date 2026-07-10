import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

// Brand display + mono, bundled with the route (extracted from the same
// @fontsource packages the site uses). Fraunces is the masthead face;
// Geist Mono carries the category kicker and editor-chrome variant.
// Bundled assets replace the old jsdelivr fetch — a third-party CDN outage
// must not take every social-share image down with it.
const FRAUNCES_BOLD = new URL("./fonts/fraunces-latin-700-normal.woff", import.meta.url);
const FRAUNCES_ITALIC = new URL("./fonts/fraunces-latin-400-italic.woff", import.meta.url);
const GEIST_MONO = new URL("./fonts/geist-mono-latin-500-normal.woff", import.meta.url);

// Loaded once per edge instance, then reused.
const fontCache = new Map<string, ArrayBuffer>();

async function loadFont(url: URL): Promise<ArrayBuffer> {
  const cached = fontCache.get(url.href);
  if (cached) return cached;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`font ${url} → ${res.status}`);
  const data = await res.arrayBuffer();
  fontCache.set(url.href, data);
  return data;
}

// Per-category accent pair, deterministic, from the brand family.
const ACCENTS: Record<string, [string, string]> = {
  "web fundamentals": ["#2dd4bf", "#22d3ee"],
  "web development": ["#2dd4bf", "#22d3ee"],
  "javascript frameworks": ["#38bdf8", "#60a5fa"],
  "backend technologies": ["#a78bfa", "#8b5cf6"],
  databases: ["#a78bfa", "#8b5cf6"],
  security: ["#fb7185", "#f43f5e"],
  "apis & integrations": ["#fbbf24", "#f59e0b"],
  "architecture & patterns": ["#818cf8", "#60a5fa"],
  "devops & infrastructure": ["#34d399", "#2dd4bf"],
  "cloud & hosting": ["#38bdf8", "#22d3ee"],
  "css ecosystem": ["#f472b6", "#fb7185"],
  "css & design": ["#f472b6", "#fb7185"],
  testing: ["#a3e635", "#34d399"],
  "testing & quality": ["#a3e635", "#34d399"],
  "tooling & workflow": ["#2dd4bf", "#34d399"],
};

function hexToRgba(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function pickAccent(category: string): [string, string] {
  const key = category.trim().toLowerCase();
  if (ACCENTS[key]) return ACCENTS[key];
  const values = Object.values(ACCENTS);
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return values[h % values.length]!;
}

function titleSize(len: number): number {
  if (len <= 26) return 82;
  if (len <= 40) return 70;
  if (len <= 58) return 60;
  if (len <= 78) return 52;
  return 46;
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Four dark layouts. The cover for a post is chosen by hashing its title,
// so the grid varies article to article instead of looking machine-stamped,
// while every cover stays inside the same brand system (Fraunces, mono
// kicker, per-category accent). An explicit ?v= overrides for previewing.
const VARIANTS = ["a", "c", "d", "e"] as const;

function Wordmark({ fg, accent, size = 28 }: { fg: string; accent: string; size?: number }) {
  return (
    <div style={{ display: "flex", fontFamily: "Fraunces", fontWeight: 700, fontSize: size }}>
      <span style={{ color: fg }}>Code</span>
      <span style={{ color: accent }}>FromScratch</span>
    </div>
  );
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title = searchParams.get("title") || "CodeFromScratch";
  const category = searchParams.get("category") || "";
  const variant = (searchParams.get("v") || VARIANTS[hash(title) % VARIANTS.length]).toLowerCase();
  const [accent, accent2] = pickAccent(category);
  const kicker = (category || "Journal").toUpperCase();

  let fonts: { name: string; data: ArrayBuffer; weight: 400 | 500 | 700; style: "normal" | "italic" }[];
  try {
    fonts = [
      { name: "Fraunces", data: await loadFont(FRAUNCES_BOLD), weight: 700, style: "normal" },
      { name: "Fraunces", data: await loadFont(FRAUNCES_ITALIC), weight: 400, style: "italic" },
      { name: "Geist Mono", data: await loadFont(GEIST_MONO), weight: 500, style: "normal" },
    ];
  } catch {
    // Font CDN unreachable — fall back to the static brand cover so link
    // previews degrade to a real image instead of a 500 with no image.
    return Response.redirect(new URL("/brand/og-default.png", req.nextUrl.origin), 302);
  }
  const size = { width: 1200, height: 630 } as const;

  // ── Variant A — Editorial Dark (masthead) ────────────────────────────
  if (variant === "a") {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "64px 70px",
            background: "linear-gradient(150deg, #0d1426 0%, #0b1120 55%, #0a0f1c 100%)",
            position: "relative",
            fontFamily: "Fraunces",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -160,
              right: -120,
              width: 520,
              height: 520,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${hexToRgba(accent, 0.28)} 0%, transparent 68%)`,
            }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div
              style={{
                fontFamily: "Geist Mono",
                fontWeight: 500,
                fontSize: 22,
                letterSpacing: "0.28em",
                color: accent,
              }}
            >
              {kicker}
            </div>
            <div style={{ width: 64, height: 4, borderRadius: 2, background: `linear-gradient(90deg, ${accent}, ${accent2})` }} />
          </div>
          <div
            style={{
              fontWeight: 700,
              fontSize: titleSize(title.length),
              lineHeight: 1.04,
              color: "#f1f5f9",
              maxWidth: 1010,
              letterSpacing: "-0.01em",
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid rgba(255,255,255,0.12)",
              paddingTop: 26,
            }}
          >
            <Wordmark fg="#f1f5f9" accent={accent} />
            <div
              style={{
                fontFamily: "Geist Mono",
                fontWeight: 500,
                fontSize: 18,
                letterSpacing: "0.22em",
                color: "rgba(241,245,249,0.5)",
              }}
            >
              THE JOURNAL
            </div>
          </div>
        </div>
      ),
      { ...size, fonts },
    );
  }

  // ── Variant B — Light Paper (printed magazine) ───────────────────────
  if (variant === "b") {
    const darkAccent = accent2;
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "64px 70px",
            background: "#f4efe4",
            position: "relative",
            fontFamily: "Fraunces",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 8,
              background: `linear-gradient(90deg, ${accent}, ${accent2})`,
            }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 8 }}>
            <div
              style={{
                fontFamily: "Geist Mono",
                fontWeight: 500,
                fontSize: 22,
                letterSpacing: "0.28em",
                color: darkAccent,
              }}
            >
              {kicker}
            </div>
          </div>
          <div
            style={{
              fontWeight: 700,
              fontSize: titleSize(title.length),
              lineHeight: 1.03,
              color: "#161b26",
              maxWidth: 1010,
              letterSpacing: "-0.01em",
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid rgba(0,0,0,0.14)",
              paddingTop: 26,
            }}
          >
            <Wordmark fg="#161b26" accent={darkAccent} />
            <div
              style={{
                fontFamily: "Geist Mono",
                fontWeight: 500,
                fontSize: 18,
                letterSpacing: "0.22em",
                color: "rgba(22,27,38,0.45)",
              }}
            >
              THE JOURNAL
            </div>
          </div>
        </div>
      ),
      { ...size, fonts },
    );
  }

  // ── Variant D — Poster (centred, minimal) ────────────────────────────
  if (variant === "d") {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "80px 80px",
            background: "radial-gradient(120% 120% at 15% 0%, #131d33 0%, #0b1120 60%)",
            position: "relative",
            fontFamily: "Fraunces",
          }}
        >
          <div
            style={{
              position: "absolute",
              bottom: -150,
              left: -90,
              width: 480,
              height: 480,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${hexToRgba(accent, 0.2)} 0%, transparent 68%)`,
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              marginBottom: 30,
            }}
          >
            <div style={{ width: 40, height: 4, borderRadius: 2, background: accent }} />
            <div
              style={{
                fontFamily: "Geist Mono",
                fontWeight: 500,
                fontSize: 22,
                letterSpacing: "0.26em",
                color: accent,
              }}
            >
              {kicker}
            </div>
          </div>
          <div
            style={{
              fontWeight: 700,
              fontSize: titleSize(title.length),
              lineHeight: 1.05,
              color: "#f1f5f9",
              maxWidth: 1000,
              letterSpacing: "-0.01em",
            }}
          >
            {title}
          </div>
          <div style={{ display: "flex", marginTop: 34 }}>
            <Wordmark fg="rgba(241,245,249,0.85)" accent={accent} size={24} />
          </div>
        </div>
      ),
      { ...size, fonts },
    );
  }

  // ── Variant E — Accent spine (left bar) ──────────────────────────────
  if (variant === "e") {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            background: "linear-gradient(135deg, #0c1322 0%, #0a0f1c 100%)",
            position: "relative",
            fontFamily: "Fraunces",
          }}
        >
          <div
            style={{
              width: 14,
              height: "100%",
              background: `linear-gradient(180deg, ${accent}, ${accent2})`,
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "66px 70px",
              flexGrow: 1,
            }}
          >
            <div
              style={{
                fontFamily: "Geist Mono",
                fontWeight: 500,
                fontSize: 22,
                letterSpacing: "0.26em",
                color: accent,
              }}
            >
              {kicker}
            </div>
            <div
              style={{
                fontWeight: 700,
                fontSize: titleSize(title.length),
                lineHeight: 1.04,
                color: "#f1f5f9",
                maxWidth: 980,
                letterSpacing: "-0.01em",
              }}
            >
              {title}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Wordmark fg="#f1f5f9" accent={accent} size={26} />
              <div
                style={{
                  fontFamily: "Geist Mono",
                  fontWeight: 500,
                  fontSize: 16,
                  letterSpacing: "0.2em",
                  color: "rgba(241,245,249,0.4)",
                }}
              >
                / THE JOURNAL
              </div>
            </div>
          </div>
        </div>
      ),
      { ...size, fonts },
    );
  }

  // ── Variant C — Editor Chrome (code-block motif) ─────────────────────
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#0b1120",
          position: "relative",
          fontFamily: "Fraunces",
        }}
      >
        {/* editor title bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "22px 32px",
            background: "#111a2e",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#ff5f57" }} />
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#febc2e" }} />
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#28c840" }} />
          <div
            style={{
              marginLeft: 16,
              fontFamily: "Geist Mono",
              fontWeight: 500,
              fontSize: 20,
              color: "rgba(241,245,249,0.55)",
            }}
          >
            {`${(category || "journal").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.md`}
          </div>
        </div>
        {/* body */}
        <div
          style={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "56px 64px",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              bottom: -140,
              right: -100,
              width: 460,
              height: 460,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${hexToRgba(accent, 0.22)} 0%, transparent 68%)`,
            }}
          />
          <div style={{ display: "flex", alignItems: "baseline", gap: 16, fontFamily: "Geist Mono", fontSize: 26 }}>
            <span style={{ color: accent2 }}>##</span>
            <span style={{ color: accent, fontWeight: 500, letterSpacing: "0.06em" }}>{kicker}</span>
          </div>
          <div
            style={{
              fontWeight: 700,
              fontSize: titleSize(title.length),
              lineHeight: 1.04,
              color: "#f1f5f9",
              maxWidth: 1010,
              letterSpacing: "-0.01em",
            }}
          >
            {title}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Wordmark fg="#f1f5f9" accent={accent} size={26} />
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
