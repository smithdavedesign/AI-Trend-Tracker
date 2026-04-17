import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name") ?? "AIRadar";
  const score = searchParams.get("score") ?? "0";
  const category = searchParams.get("category") ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fafaf9",
          background: "linear-gradient(135deg, #fafaf9 0%, #e7e5e4 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              fontSize: 24,
              color: "#6366f1",
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            AIRadar
          </div>
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              color: "#1c1917",
              letterSpacing: "-0.03em",
            }}
          >
            {name}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 96,
                height: 96,
                borderRadius: "50%",
                backgroundColor:
                  Number(score) >= 80
                    ? "#10b98120"
                    : Number(score) >= 60
                    ? "#6366f120"
                    : "#f59e0b20",
                fontSize: 40,
                fontWeight: 800,
                color:
                  Number(score) >= 80
                    ? "#10b981"
                    : Number(score) >= 60
                    ? "#6366f1"
                    : "#f59e0b",
              }}
            >
              {Number(score).toFixed(0)}
            </div>
            {category && (
              <div
                style={{
                  fontSize: 24,
                  color: "#78716c",
                  textTransform: "capitalize",
                }}
              >
                {category}
              </div>
            )}
          </div>
          <div
            style={{
              fontSize: 18,
              color: "#a8a29e",
              marginTop: 8,
            }}
          >
            RadarScore — Automated AI Tool Intelligence
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
