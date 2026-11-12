import type { MetadataRoute } from "next";

// Private and account pages are never for search engines. (Pre-launch, the whole site is also marked noindex in the
// root layout; that line is removed at deployment, Phase 8.)
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", disallow: ["/admin", "/dashboard", "/verify", "/login", "/register", "/reset-password", "/auth"] }],
  };
}
