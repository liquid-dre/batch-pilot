"use client";

/**
 * Last-resort error boundary for the root layout. Must render its own
 * <html>/<body>. Kept minimal and dependency-free so it always renders.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", margin: 0, background: "#faf8f4", color: "#0c090d" }}>
        <div style={{ textAlign: "center", padding: "2rem", maxWidth: "28rem" }}>
          <h1 style={{ fontSize: "1.3rem", fontWeight: 700 }}>Something went wrong</h1>
          <p style={{ color: "#44474e", marginTop: "0.5rem" }}>Please reload the page to continue.</p>
          <button
            onClick={reset}
            style={{ marginTop: "1.25rem", height: 48, padding: "0 1.5rem", borderRadius: 10, border: "none", background: "#d4164a", color: "#fff", fontWeight: 600, cursor: "pointer" }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
