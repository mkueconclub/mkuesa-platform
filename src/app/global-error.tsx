"use client";

/** Last-resort page if the root layout itself fails. It has to bring its own <html> and cannot rely on the site's styles. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f4f0e7", color: "#1d1526" }}>
        <main style={{ maxWidth: 640, margin: "0 auto", padding: "96px 16px" }}>
          <h1 style={{ fontSize: 32, margin: "0 0 12px" }}>Something went wrong</h1>
          <p style={{ fontSize: 18, lineHeight: 1.5 }}>The site could not be displayed. Please try again in a moment.</p>
          <button type="button" onClick={reset} style={{ marginTop: 16, height: 44, padding: "0 20px", borderRadius: 6, border: 0, background: "#650487", color: "#fff", fontSize: 16, fontWeight: 600, cursor: "pointer" }}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
