import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

// Bespoke diagram covers for the three pillar articles. Unlike the default
// text covers, these *teach* at a glance — the stack chain, the production
// checklist, the deploy pipeline — which is the whole brand promise. Driven
// by ?key=fullstack|production|ship.

const FRAUNCES_BOLD =
  "https://cdn.jsdelivr.net/npm/@fontsource/fraunces@5/files/fraunces-latin-700-normal.woff";
const GEIST_MONO =
  "https://cdn.jsdelivr.net/npm/@fontsource/geist-mono@5/files/geist-mono-latin-500-normal.woff";

async function loadFont(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`font ${url} → ${res.status}`);
  return res.arrayBuffer();
}

function rgba(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

type Cfg = { kicker: string; title: string; accent: string; accent2: string };
const CONFIG: Record<string, Cfg> = {
  fullstack: {
    kicker: "MODERN FULL-STACK",
    title: "One stack, explained end to end",
    accent: "#2dd4bf",
    accent2: "#22d3ee",
  },
  production: {
    kicker: "PRODUCTION-GRADE CODE",
    title: "What separates real apps from hobby apps",
    accent: "#818cf8",
    accent2: "#60a5fa",
  },
  ship: {
    kicker: "SHIP IT",
    title: "From git push to live, and back",
    accent: "#38bdf8",
    accent2: "#22d3ee",
  },
};

function Wordmark({ accent }: { accent: string }) {
  return (
    <div style={{ display: "flex", fontFamily: "Fraunces", fontWeight: 700, fontSize: 24 }}>
      <span style={{ color: "rgba(241,245,249,0.85)" }}>Code</span>
      <span style={{ color: accent }}>FromScratch</span>
    </div>
  );
}

// A labelled node box used across the diagrams.
function Node({ top, bottom, accent }: { top: string; bottom: string; accent: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        padding: "18px 22px",
        borderRadius: 14,
        background: rgba(accent, 0.1),
        border: `1px solid ${rgba(accent, 0.35)}`,
      }}
    >
      <div style={{ fontFamily: "Geist Mono", fontWeight: 500, fontSize: 24, color: "#f1f5f9" }}>
        {top}
      </div>
      <div style={{ fontFamily: "Geist Mono", fontWeight: 500, fontSize: 14, letterSpacing: "0.12em", color: rgba(accent, 0.9) }}>
        {bottom}
      </div>
    </div>
  );
}

function Arrow({ color }: { color: string }) {
  return (
    <div style={{ display: "flex", fontFamily: "Geist Mono", fontSize: 30, color, paddingBottom: 14 }}>
      →
    </div>
  );
}

// ✓ and ↩ are absent from Geist Mono and render as tofu, so the icons are
// drawn as SVG paths instead.
function CheckIcon({ color }: { color: string }) {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <path d="M5 13l4 4L19 7" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BackIcon({ color }: { color: string }) {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <path d="M11 5l-7 7 7 7M4 12h16" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Frame({
  cfg,
  children,
}: {
  cfg: Cfg;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "60px 70px",
        background: "linear-gradient(150deg, #0d1426 0%, #0b1120 60%, #0a0f1c 100%)",
        position: "relative",
        fontFamily: "Fraunces",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -160,
          right: -120,
          width: 480,
          height: 480,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${rgba(cfg.accent, 0.22)} 0%, transparent 68%)`,
        }}
      />
      {/* header */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: cfg.accent }} />
          <div
            style={{
              fontFamily: "Geist Mono",
              fontWeight: 500,
              fontSize: 20,
              letterSpacing: "0.26em",
              color: cfg.accent,
            }}
          >
            {cfg.kicker}
          </div>
        </div>
        <div style={{ fontWeight: 700, fontSize: 48, lineHeight: 1.05, color: "#f1f5f9", maxWidth: 900 }}>
          {cfg.title}
        </div>
      </div>
      {/* diagram */}
      <div style={{ display: "flex", justifyContent: "center", flexGrow: 1, alignItems: "center" }}>
        {children}
      </div>
      {/* footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Wordmark accent={cfg.accent} />
        <div
          style={{
            fontFamily: "Geist Mono",
            fontWeight: 500,
            fontSize: 16,
            letterSpacing: "0.2em",
            color: "rgba(241,245,249,0.4)",
          }}
        >
          THE JOURNAL
        </div>
      </div>
    </div>
  );
}

export async function GET(req: NextRequest) {
  const key = (req.nextUrl.searchParams.get("key") || "fullstack").toLowerCase();
  const cfg = CONFIG[key] || CONFIG.fullstack!;

  const fonts = [
    { name: "Fraunces", data: await loadFont(FRAUNCES_BOLD), weight: 700 as const, style: "normal" as const },
    { name: "Geist Mono", data: await loadFont(GEIST_MONO), weight: 500 as const, style: "normal" as const },
  ];
  const size = { width: 1200, height: 630 } as const;
  const { accent, accent2 } = cfg;

  let diagram: React.ReactNode;

  if (key === "production") {
    // Checklist of the production disciplines.
    const items = [
      "Validate every input",
      "Errors are part of the contract",
      "Rate-limit before you need it",
      "Logs you can search at 2am",
      "Test the money paths",
      "Secrets, sessions, headers",
    ];
    diagram = (
      <div style={{ display: "flex", flexDirection: "column", gap: 14, width: 760 }}>
        {items.map((label) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 30,
                height: 30,
                borderRadius: 8,
                background: rgba(accent, 0.15),
                border: `1px solid ${rgba(accent, 0.5)}`,
              }}
            >
              <CheckIcon color={accent} />
            </div>
            <div style={{ fontFamily: "Geist Mono", fontWeight: 500, fontSize: 22, color: "#e7edf5" }}>
              {label}
            </div>
          </div>
        ))}
      </div>
    );
  } else if (key === "ship") {
    // Deploy pipeline with a rollback annotation.
    diagram = (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Node top="git push" bottom="COMMIT" accent={accent} />
          <Arrow color={rgba(accent, 0.8)} />
          <Node top="build" bottom="CI" accent={accent} />
          <Arrow color={rgba(accent, 0.8)} />
          <Node top="deploy" bottom="EDGE" accent={accent} />
          <Arrow color={rgba(accent, 0.8)} />
          <Node top="live" bottom="USERS" accent={accent2} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: "Geist Mono", fontSize: 18, color: rgba(accent, 0.85) }}>
          <BackIcon color={rgba(accent, 0.85)} />
          <span>rollback in seconds, not git surgery</span>
        </div>
      </div>
    );
  } else {
    // Full-stack: the chain of typed contracts.
    diagram = (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Node top="Postgres" bottom="DATA" accent={accent} />
          <Arrow color={rgba(accent, 0.8)} />
          <Node top="Prisma" bottom="TYPES" accent={accent} />
          <Arrow color={rgba(accent, 0.8)} />
          <Node top="Server" bottom="RSC" accent={accent} />
          <Arrow color={rgba(accent, 0.8)} />
          <Node top="React" bottom="UI" accent={accent2} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: "Geist Mono", fontSize: 18, color: rgba(accent, 0.85) }}>
          <span>one typed contract, top to bottom</span>
        </div>
      </div>
    );
  }

  return new ImageResponse(<Frame cfg={cfg}>{diagram}</Frame>, { ...size, fonts });
}
