import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title = searchParams.get("title") || "CodeFromScratch";
  const category = searchParams.get("category") || "";

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
            background: "radial-gradient(circle, rgba(45,212,191,0.3) 0%, transparent 70%)",
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
            background: "radial-gradient(circle, rgba(34,211,238,0.2) 0%, transparent 70%)",
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
            background: "linear-gradient(90deg, #2dd4bf, #22d3ee)",
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
                background: "rgba(45,212,191,0.15)",
                color: "#2dd4bf",
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
          <span style={{ fontSize: "24px", fontWeight: 700, color: "#2dd4bf" }}>
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
