import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_SHORT_NAME } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — Portfolio`,
    short_name: SITE_SHORT_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0ea5e9",
    icons: [
      {
        src: "/avatar.jpg",
        sizes: "192x192",
        type: "image/jpeg",
      },
      {
        src: "/avatar.jpg",
        sizes: "512x512",
        type: "image/jpeg",
      },
    ],
  };
}
