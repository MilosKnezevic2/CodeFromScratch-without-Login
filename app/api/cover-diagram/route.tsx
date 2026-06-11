import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

// Bespoke diagram covers for the flagship articles. Unlike the default text
// covers, these *teach* at a glance — a chain, a checklist, a comparison, a
// gate — which is the brand promise. Driven by ?key=<slug-key>. Each key maps
// to a diagram type plus its data; types are reused across articles so new
// covers are cheap to add.

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

const REJECT = "#fb7185";

type Node2 = { top: string; bottom: string };
type Panel = { head: string; traits: string[] };
type Cfg = {
  kicker: string;
  title: string;
  accent: string;
  accent2: string;
  type: "chain" | "checklist" | "compare2" | "compare3" | "gate" | "bucket" | "split";
  nodes?: Node2[];
  caption?: string;
  items?: string[];
  panels?: Panel[];
  gate?: { from: string; mid: string; to: string };
  split?: { leftHead: string; left: string[]; rightHead: string; right: string[] };
};

const CONFIG: Record<string, Cfg> = {
  // ── pillars ──
  fullstack: {
    kicker: "MODERN FULL-STACK",
    title: "One stack, explained end to end",
    accent: "#2dd4bf",
    accent2: "#22d3ee",
    type: "chain",
    nodes: [
      { top: "Postgres", bottom: "DATA" },
      { top: "Prisma", bottom: "TYPES" },
      { top: "Server", bottom: "RSC" },
      { top: "React", bottom: "UI" },
    ],
    caption: "one typed contract, top to bottom",
  },
  production: {
    kicker: "PRODUCTION-GRADE CODE",
    title: "What separates real apps from hobby apps",
    accent: "#818cf8",
    accent2: "#60a5fa",
    type: "checklist",
    items: [
      "Validate every input",
      "Errors are part of the contract",
      "Rate-limit before you need it",
      "Logs you can search at 2am",
      "Test the money paths",
      "Secrets, sessions, headers",
    ],
  },
  ship: {
    kicker: "SHIP IT",
    title: "From git push to live, and back",
    accent: "#38bdf8",
    accent2: "#22d3ee",
    type: "chain",
    nodes: [
      { top: "git push", bottom: "COMMIT" },
      { top: "build", bottom: "CI" },
      { top: "deploy", bottom: "EDGE" },
      { top: "live", bottom: "USERS" },
    ],
    caption: "rollback in seconds, not git surgery",
  },
  // ── clusters ──
  "prisma-vs-drizzle": {
    kicker: "PRISMA VS DRIZZLE",
    title: "Two philosophies, one decision",
    accent: "#a78bfa",
    accent2: "#8b5cf6",
    type: "compare2",
    panels: [
      { head: "Prisma", traits: ["Schema-first DSL", "Queries abstract SQL", "Migrations managed"] },
      { head: "Drizzle", traits: ["SQL-first, in TS", "Queries mirror SQL", "Lighter at the edge"] },
    ],
  },
  "managed-postgres": {
    kicker: "MANAGED POSTGRES",
    title: "Neon vs Supabase vs Railway",
    accent: "#a78bfa",
    accent2: "#8b5cf6",
    type: "compare3",
    panels: [
      { head: "Neon", traits: ["Scale-to-zero", "Branching"] },
      { head: "Supabase", traits: ["Auth + storage", "Batteries-in"] },
      { head: "Railway", traits: ["One platform", "Simple ops"] },
    ],
  },
  zod: {
    kicker: "ZOD AT THE TRUST BOUNDARY",
    title: "Validate where data enters",
    accent: "#818cf8",
    accent2: "#60a5fa",
    type: "gate",
    gate: { from: "Untrusted input", mid: "ZOD", to: "Typed & safe" },
  },
  "rate-limiting": {
    kicker: "RATE LIMITING",
    title: "Before you need it, not after",
    accent: "#fb7185",
    accent2: "#f43f5e",
    type: "bucket",
  },
  rsc: {
    kicker: "REACT SERVER COMPONENTS",
    title: "Where your code actually runs",
    accent: "#38bdf8",
    accent2: "#60a5fa",
    type: "split",
    split: {
      leftHead: "SERVER",
      left: ["Fetch data", "Read secrets", "Query the DB"],
      rightHead: "CLIENT",
      right: ["State & effects", "Events & input", "Browser APIs"],
    },
  },
  stripe: {
    kicker: "STRIPE SUBSCRIPTIONS",
    title: "The flow that survives production",
    accent: "#fbbf24",
    accent2: "#f59e0b",
    type: "chain",
    nodes: [
      { top: "Checkout", bottom: "CLIENT" },
      { top: "Stripe", bottom: "PAYMENT" },
      { top: "Webhook", bottom: "VERIFY" },
      { top: "Access", bottom: "GRANT" },
    ],
    caption: "the webhook is the source of truth, not the redirect",
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
      <div style={{ fontFamily: "Geist Mono", fontWeight: 500, fontSize: 24, color: "#f1f5f9" }}>{top}</div>
      <div style={{ fontFamily: "Geist Mono", fontWeight: 500, fontSize: 13, letterSpacing: "0.12em", color: rgba(accent, 0.9) }}>
        {bottom}
      </div>
    </div>
  );
}

function Arrow({ color }: { color: string }) {
  return <div style={{ display: "flex", fontFamily: "Geist Mono", fontSize: 30, color, paddingBottom: 14 }}>→</div>;
}

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

function PanelCard({ p, accent, width }: { p: Panel; accent: string; width: number }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        width,
        padding: "22px 24px",
        borderRadius: 16,
        background: rgba(accent, 0.08),
        border: `1px solid ${rgba(accent, 0.3)}`,
      }}
    >
      <div style={{ fontFamily: "Fraunces", fontWeight: 700, fontSize: 30, color: "#f1f5f9" }}>{p.head}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {p.traits.map((t) => (
          <div key={t} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 6, height: 6, borderRadius: 3, background: accent }} />
            <div style={{ fontFamily: "Geist Mono", fontWeight: 500, fontSize: 17, color: "#cdd6e3" }}>{t}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Frame({ cfg, children }: { cfg: Cfg; children: React.ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "58px 70px",
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
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: cfg.accent }} />
          <div style={{ fontFamily: "Geist Mono", fontWeight: 500, fontSize: 20, letterSpacing: "0.24em", color: cfg.accent }}>
            {cfg.kicker}
          </div>
        </div>
        <div style={{ fontWeight: 700, fontSize: 46, lineHeight: 1.05, color: "#f1f5f9", maxWidth: 920 }}>{cfg.title}</div>
      </div>
      <div style={{ display: "flex", justifyContent: "center", flexGrow: 1, alignItems: "center" }}>{children}</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Wordmark accent={cfg.accent} />
        <div style={{ fontFamily: "Geist Mono", fontWeight: 500, fontSize: 16, letterSpacing: "0.2em", color: "rgba(241,245,249,0.4)" }}>
          THE JOURNAL
        </div>
      </div>
    </div>
  );
}

function Caption({ text, accent, icon }: { text: string; accent: string; icon?: "back" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: "Geist Mono", fontSize: 18, color: rgba(accent, 0.85) }}>
      {icon === "back" ? <BackIcon color={rgba(accent, 0.85)} /> : null}
      <span>{text}</span>
    </div>
  );
}

export async function GET(req: NextRequest) {
  const key = (req.nextUrl.searchParams.get("key") || "fullstack").toLowerCase();
  const cfg = CONFIG[key] || CONFIG.fullstack!;
  const { accent, accent2 } = cfg;

  const fonts = [
    { name: "Fraunces", data: await loadFont(FRAUNCES_BOLD), weight: 700 as const, style: "normal" as const },
    { name: "Geist Mono", data: await loadFont(GEIST_MONO), weight: 500 as const, style: "normal" as const },
  ];
  const size = { width: 1200, height: 630 } as const;

  let diagram: React.ReactNode = null;

  if (cfg.type === "chain" && cfg.nodes) {
    diagram = (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {cfg.nodes.map((n, i) => (
            <div key={n.top} style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Node top={n.top} bottom={n.bottom} accent={i === cfg.nodes!.length - 1 ? accent2 : accent} />
              {i < cfg.nodes!.length - 1 ? <Arrow color={rgba(accent, 0.8)} /> : null}
            </div>
          ))}
        </div>
        {cfg.caption ? <Caption text={cfg.caption} accent={accent} icon={key === "ship" ? "back" : undefined} /> : null}
      </div>
    );
  } else if (cfg.type === "checklist" && cfg.items) {
    diagram = (
      <div style={{ display: "flex", flexDirection: "column", gap: 14, width: 760 }}>
        {cfg.items.map((label) => (
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
            <div style={{ fontFamily: "Geist Mono", fontWeight: 500, fontSize: 22, color: "#e7edf5" }}>{label}</div>
          </div>
        ))}
      </div>
    );
  } else if (cfg.type === "compare2" && cfg.panels) {
    diagram = (
      <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
        <PanelCard p={cfg.panels[0]!} accent={accent} width={360} />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 56,
            height: 56,
            borderRadius: 28,
            background: rgba(accent, 0.14),
            border: `1px solid ${rgba(accent, 0.4)}`,
            fontFamily: "Geist Mono",
            fontSize: 20,
            color: accent,
          }}
        >
          VS
        </div>
        <PanelCard p={cfg.panels[1]!} accent={accent2} width={360} />
      </div>
    );
  } else if (cfg.type === "compare3" && cfg.panels) {
    diagram = (
      <div style={{ display: "flex", alignItems: "stretch", gap: 18 }}>
        {cfg.panels.map((p, i) => (
          <PanelCard key={p.head} p={p} accent={i === 1 ? accent2 : accent} width={260} />
        ))}
      </div>
    );
  } else if (cfg.type === "gate" && cfg.gate) {
    diagram = (
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <Node top={cfg.gate.from} bottom="HOSTILE" accent={REJECT} />
        <Arrow color={rgba(accent, 0.8)} />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "26px 34px",
            borderRadius: 16,
            background: rgba(accent, 0.16),
            border: `2px solid ${rgba(accent, 0.6)}`,
            fontFamily: "Geist Mono",
            fontSize: 34,
            color: "#f1f5f9",
          }}
        >
          {cfg.gate.mid}
        </div>
        <Arrow color={rgba(accent, 0.8)} />
        <Node top={cfg.gate.to} bottom="TRUSTED" accent={accent2} />
      </div>
    );
  } else if (cfg.type === "bucket") {
    diagram = (
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {["req", "req", "req", "req"].map((r, i) => (
            <div key={i} style={{ fontFamily: "Geist Mono", fontSize: 18, color: rgba(accent, 0.8) }}>
              {`${r} →`}
            </div>
          ))}
        </div>
        <Node top="limiter" bottom="10 / MIN" accent={accent} />
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 18px",
              borderRadius: 10,
              background: rgba(accent2, 0.12),
              border: `1px solid ${rgba(accent2, 0.4)}`,
              fontFamily: "Geist Mono",
              fontSize: 18,
              color: "#e7edf5",
            }}
          >
            200 OK
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 18px",
              borderRadius: 10,
              background: rgba(REJECT, 0.12),
              border: `1px solid ${rgba(REJECT, 0.45)}`,
              fontFamily: "Geist Mono",
              fontSize: 18,
              color: "#f6c9cf",
            }}
          >
            429 Too Many
          </div>
        </div>
      </div>
    );
  } else if (cfg.type === "split" && cfg.split) {
    const col = (head: string, items: string[], a: string) => (
      <div style={{ display: "flex", flexDirection: "column", gap: 14, width: 320, padding: "26px 28px" }}>
        <div style={{ fontFamily: "Geist Mono", fontWeight: 500, fontSize: 20, letterSpacing: "0.2em", color: a }}>{head}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((t) => (
            <div key={t} style={{ fontFamily: "Geist Mono", fontWeight: 500, fontSize: 18, color: "#cdd6e3" }}>{t}</div>
          ))}
        </div>
      </div>
    );
    diagram = (
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          borderRadius: 18,
          overflow: "hidden",
          border: `1px solid ${rgba(accent, 0.3)}`,
        }}
      >
        {col(cfg.split.leftHead, cfg.split.left, accent)}
        <div style={{ width: 1, background: rgba(accent, 0.3) }} />
        {col(cfg.split.rightHead, cfg.split.right, accent2)}
      </div>
    );
  }

  return new ImageResponse(<Frame cfg={cfg}>{diagram}</Frame>, { ...size, fonts });
}
