import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

// Per-category accent palette. Covers double as featured images on the blog
// grid — a single accent made ten cards read as one navy blur, so each
// category gets its own hue from the brand family. Deterministic: same
// category, same colour, forever.
const ACCENTS: Record<string, [string, string]> = {
  "web fundamentals": ["#2dd4bf", "#22d3ee"], // teal → cyan (brand default)
  "javascript frameworks": ["#22d3ee", "#60a5fa"], // cyan → blue
  "backend technologies": ["#8b5cf6", "#6366f1"], // violet → indigo
  "apis & integrations": ["#f59e0b", "#fbbf24"], // amber
  "css & design": ["#fb7185", "#f472b6"], // rose → pink
  "tooling & workflow": ["#34d399", "#2dd4bf"], // emerald → teal
  "web development": ["#2dd4bf", "#22d3ee"],
  "testing & quality": ["#34d399", "#a3e635"], // emerald → lime
};

function hexToRgba(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

function pickAccent(category: string): [string, string] {
  const key = category.trim().toLowerCase();
  if (ACCENTS[key]) return ACCENTS[key];
  // Unknown categories hash onto the palette so new topics stay on-brand.
  const values = Object.values(ACCENTS);
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return values[h % values.length];
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title = searchParams.get("title") || "CodeFromScratch";
  const category = searchParams.get("category") || "";
  const [accent, accent2] = pickAccent(category);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "60px",
          background: "linear-gradient(135deg, #131a2e 0%, #182040 50%, #1e2d4a 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Accent orbs */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-50px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${hexToRgba(accent, 0.3)} 0%, transparent 70%)`,
            filter: "blur(60px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-80px",
            left: "-30px",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${hexToRgba(accent2, 0.2)} 0%, transparent 70%)`,
            filter: "blur(50px)",
          }}
        />

        {/* Top bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: `linear-gradient(90deg, ${accent}, ${accent2})`,
          }}
        />

        {/* Category */}
        {category && (
          <div
            style={{
              display: "flex",
              marginBottom: "16px",
            }}
          >
            <span
              style={{
                background: hexToRgba(accent, 0.15),
                color: accent,
                padding: "6px 16px",
                borderRadius: "20px",
                fontSize: "20px",
                fontWeight: 600,
              }}
            >
              {category}
            </span>
          </div>
        )}

        {/* Title */}
        <h1
          style={{
            fontSize: title.length > 60 ? "42px" : "52px",
            fontWeight: 800,
            color: "#e2e8f0",
            lineHeight: 1.2,
            margin: 0,
            maxWidth: "900px",
          }}
        >
          {title}
        </h1>

        {/* Branding */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: "32px",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "24px", fontWeight: 700, color: "#e2e8f0" }}>
            Code
          </span>
          <span style={{ fontSize: "24px", fontWeight: 700, color: accent }}>
            FromScratch
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
