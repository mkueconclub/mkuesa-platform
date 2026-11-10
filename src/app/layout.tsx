import type { Metadata, Viewport } from "next";
import "@fontsource-variable/newsreader";
import "@fontsource-variable/public-sans";
import "./globals.css";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: `${siteConfig.name} | ${siteConfig.fullName}`, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
  // Pre-launch: remove this line when the site goes live (Phase 8).
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#220131" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col">{children}</body>
    </html>
  );
}
