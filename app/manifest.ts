import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site-url";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  const base = getSiteUrl();
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fdf2f8",
    theme_color: "#ec4899",
    lang: "en",
    id: base,
  };
}
