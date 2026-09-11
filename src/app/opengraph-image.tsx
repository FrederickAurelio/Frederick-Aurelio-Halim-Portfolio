import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { SITE_JOB_TITLE, SITE_NAME } from "@/lib/site";
import { hero } from "@/utils/data";

export const alt = `${SITE_NAME} — ${SITE_JOB_TITLE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const background = await readFile(
    join(process.cwd(), "public/bg.jpg"),
    "base64",
  );
  const copy = hero.en.hero;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          position: "relative",
          backgroundColor: "#f8fafc",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <img
          src={`data:image/jpeg;base64,${background}`}
          alt=""
          width={1200}
          height={630}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1200,
            height: 630,
            objectFit: "cover",
            opacity: 0.1,
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            padding: "48px 72px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 28,
              fontWeight: 700,
              color: "#075985",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            {copy.name}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 76,
              fontWeight: 700,
              color: "#0284c7",
              lineHeight: 1.05,
              marginBottom: 24,
            }}
          >
            {copy.title}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              fontSize: 30,
              color: "#075985",
              lineHeight: 1.45,
              textAlign: "center",
            }}
          >
            <div style={{ display: "flex" }}>{copy.subTitle[0].trimEnd()}</div>
            <div
              style={{
                display: "flex",
                fontWeight: 700,
                color: "#0ea5e9",
              }}
            >
              {copy.stack}
              {copy.subTitle[1]}
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
