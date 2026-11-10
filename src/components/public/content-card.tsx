import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

type Props = { label?: string; title: string; summary: string; href?: string; sample?: boolean; children?: ReactNode; className?: string };

/** Generic card for announcements, resources, publications and opportunities. */
export function ContentCard({ label, title, summary, href, sample = false, children, className }: Props) {
  return (
    <Card className={cn("relative flex h-full flex-col gap-3", href && "transition-shadow hover:shadow-md", className)}>
      <div className="flex flex-wrap items-center gap-2">
        {label && <Badge>{label}</Badge>}
        {sample && <Badge tone="neutral">Sample content</Badge>}
      </div>
      <h3 className="text-xl text-brand-900">
        {href ? (
          <Link href={href} className="after:absolute after:inset-0 after:content-[''] hover:underline">
            {title}
          </Link>
        ) : (
          title
        )}
      </h3>
      <p className="text-muted">{summary}</p>
      {children}
    </Card>
  );
}
