"use client";

import Link from "next/link";
import { useEffect } from "react";

/** Shown when something unexpected fails while rendering a page. Never shows technical details to visitors. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("page error:", error.digest ?? error.message);
  }, [error]);

  return (
    <main id="main" className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col justify-center gap-4 px-4 py-16">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-700">Something went wrong</p>
      <h1 className="text-3xl text-brand-900 sm:text-4xl">We could not load this page</h1>
      <p className="text-lg text-muted">This is a problem on our side, not yours. Please try again. If it keeps happening, tell the association using the contact page.</p>
      {error.digest && <p className="text-sm text-muted">Reference: <span className="font-mono">{error.digest}</span></p>}
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="inline-flex h-11 items-center rounded-md bg-brand-700 px-5 font-semibold text-white hover:bg-brand-800">Try again</button>
        <Link href="/" className="inline-flex h-11 items-center rounded-md border border-brand-700 px-5 font-semibold text-brand-700 hover:bg-brand-50">Back to home</Link>
      </div>
    </main>
  );
}
