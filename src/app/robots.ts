import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://luvea.com.br";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/precos", "/termos-de-uso", "/politica-de-privacidade"],
        disallow: ["/app", "/app/*", "/api/*"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
