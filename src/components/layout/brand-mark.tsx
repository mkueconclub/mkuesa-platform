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
    <Link href="/" className={cn("flex min-w-0 items-center gap-2.5 sm:gap-3", className)}>
      <Image src={siteConfig.logo} alt="" width={44} height={44} priority className="size-11 shrink-0 rounded-full" />
      <span className="min-w-0 leading-tight">
        <span className={cn("block truncate font-display text-xl font-semibold tracking-wide", light ? "text-white" : "text-brand-900")}>
          {siteConfig.name}
        </span>
        <span className={cn("block truncate text-[0.65rem] font-medium uppercase tracking-[0.1em] min-[400px]:text-[0.7rem] min-[400px]:tracking-[0.14em]", light ? "text-brand-200" : "text-muted")}>
          {siteConfig.university}
        </span>
      </span>
    </Link>
  );
}
