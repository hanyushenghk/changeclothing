import { ImageResponse } from "next/og";

import { SITE_NAME } from "@/lib/seo";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #ec4899, #06b6d4)",
          color: "white",
          fontSize: 18,
          fontWeight: 800,
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        {SITE_NAME.slice(0, 2).toUpperCase()}
      </div>
    ),
    { ...size },
  );
}
