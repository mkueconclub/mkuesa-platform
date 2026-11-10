import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils/cn";

/**
 * Logo + wordmark. The interim logo is a 400px JPEG with a grey background,
 * cropped to a circle. Replace with the SVG / transparent PNG when supplied.
 */
export function BrandMark({ light = false, className }: { light?: boolean; className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-3", className)}>
      <Image src={siteConfig.logo} alt="" width={44} height={44} priority className="size-11 rounded-full" />
      <span className="leading-tight">
        <span className={cn("block font-display text-xl font-semibold tracking-wide", light ? "text-white" : "text-brand-900")}>
          {siteConfig.name}
        </span>
        <span className={cn("block text-[0.7rem] font-medium uppercase tracking-[0.14em]", light ? "text-brand-200" : "text-muted")}>
          {siteConfig.university}
        </span>
      </span>
    </Link>
  );
}
