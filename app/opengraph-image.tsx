import { ImageResponse } from "next/og";

import { SITE_NAME } from "@/lib/seo";

export const alt = `${SITE_NAME} — virtual try-on for online apparel shopping`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          background: "linear-gradient(135deg, #fdf2f8 0%, #fce7f3 42%, #e0f2fe 100%)",
          padding: 72,
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 68,
            fontWeight: 800,
            color: "#831843",
            letterSpacing: -2,
            lineHeight: 1.05,
          }}
        >
          {SITE_NAME}
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 38,
            fontWeight: 600,
            color: "#9f1239",
            maxWidth: 980,
            lineHeight: 1.2,
          }}
        >
          Virtual try-on previews for online shopping
        </div>
        <div
          style={{
            marginTop: 22,
            fontSize: 26,
            color: "#475569",
            maxWidth: 920,
            lineHeight: 1.35,
          }}
        >
          Upload your photo and a garment — reference preview, not sizing advice.
        </div>
      </div>
    ),
    { ...size },
  );
}
