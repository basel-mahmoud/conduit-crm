"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "grid",
          placeItems: "center",
          minHeight: "100vh",
          margin: 0,
          background: "#0b0d10",
          color: "#e8eaed",
        }}
      >
        <div style={{ textAlign: "center", padding: 40 }}>
          <h2 style={{ fontSize: 18 }}>Something went wrong</h2>
          <p style={{ opacity: 0.7, fontSize: 14 }}>
            A critical error occurred.
          </p>
          <button
            onClick={() => reset()}
            style={{
              marginTop: 16,
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid #2a313a",
              background: "#111419",
              color: "#e8eaed",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
