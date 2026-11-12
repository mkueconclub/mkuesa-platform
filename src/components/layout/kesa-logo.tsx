"use client";

import Image from "next/image";
import { useState } from "react";
import { affiliation } from "@/config/site";
import { cn } from "@/lib/utils/cn";

/** KESA logo on a white tile. Falls back to a "KESA" monogram if the file has not been added yet. */
export function KesaLogo({ className }: { className?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1 ring-1 ring-black/5",
        className,
      )}
    >
      {failed ? (
        <span className="font-display text-sm font-bold tracking-wide text-brand-900">{affiliation.short}</span>
      ) : (
        <Image
          src={affiliation.logo}
          alt=""
          width={96}
          height={96}
          className="size-full object-contain"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}
