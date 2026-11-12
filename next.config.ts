import type { NextConfig } from "next";

// Baseline security headers. A Content-Security-Policy is added in Phase 7,
// once all third-party origins (Supabase, Turnstile) are known.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // The poster route reads fonts and the logo from disk at request time; make sure they ship with it.
  outputFileTracingIncludes: {
    "/admin/announcements/[id]/poster": ["./src/lib/poster/fonts/**/*", "./public/logos/**/*"],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
