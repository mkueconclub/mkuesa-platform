import type { ReactNode } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/layout/brand-mark";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";

/**
 * Shared chrome for login / register / password-reset.
 * Wider on desktop so the form does not look like a thin vertical strip.
 */
export function AuthCard({
  title,
  description,
  children,
  wide = false,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  /** Use on register (more fields) for a slightly wider card on large screens. */
  wide?: boolean;
}) {
  return (
    <div className="bg-ivory py-10 sm:py-14 lg:py-16">
      <Container className={wide ? "max-w-lg sm:max-w-xl" : "max-w-md sm:max-w-lg"}>
        <div className="mb-8 flex justify-center sm:mb-10">
          <BrandMark />
        </div>

        <Card className="border border-brand-100/80 p-6 shadow-md shadow-brand-900/5 sm:p-8 lg:p-10">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl text-brand-900 sm:text-3xl">{title}</h1>
            {description && (
              <p className="mt-2 max-w-prose text-[15px] leading-relaxed text-muted">{description}</p>
            )}
          </div>
          <div>{children}</div>
        </Card>

        <p className="mt-6 text-center text-xs text-muted sm:mt-8">
          By continuing you agree to MKUESA&apos;s{" "}
          <Link href="/privacy" className="font-medium text-brand-700 underline-offset-2 hover:underline">
            privacy notice
          </Link>
          .
        </p>
      </Container>
    </div>
  );
}
