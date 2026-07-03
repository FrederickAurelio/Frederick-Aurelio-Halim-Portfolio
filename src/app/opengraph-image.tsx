import { ImageResponse } from "next/og";
import { SITE_JOB_TITLE, SITE_NAME } from "@/lib/site";

export const alt = `${SITE_NAME} — ${SITE_JOB_TITLE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f8fafc 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "48px 64px",
            borderRadius: 24,
            background: "rgba(255, 255, 255, 0.85)",
            border: "2px solid #0ea5e9",
          }}
        >
          <div
            style={{
              fontSize: 56,
              fontWeight: 700,
              color: "#0369a1",
              marginBottom: 16,
            }}
          >
            {SITE_NAME}
          </div>
          <div
            style={{
              fontSize: 36,
              fontWeight: 600,
              color: "#0284c7",
              marginBottom: 24,
            }}
          >
            {SITE_JOB_TITLE}
          </div>
          <div
            style={{
              fontSize: 24,
              color: "#475569",
            }}
          >
            React · Next.js · Express
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
