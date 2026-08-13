import Link from "next/link";

export default function NotFound() {
  return (
    <main
      style={{
        position: "relative",
        zIndex: 10,
        minHeight: "100svh",
        display: "grid",
        placeItems: "center",
        padding: "clamp(96px, 13vh, 150px) clamp(16px, 3vw, 56px)",
        textAlign: "center",
      }}
    >
      <div style={{ display: "grid", gap: "clamp(16px, 2.4vh, 30px)", justifyItems: "center" }}>
        <p
          style={{
            margin: 0,
            fontFamily: "var(--ff-body)", fontStretch: "87.5%",
            fontSize: "11px",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            opacity: 0.6,
          }}
        >
          404
        </p>
        <h1
          style={{
            margin: 0,
            fontFamily: "var(--ff-display)",
            fontWeight: 700,
            fontSize: "clamp(1.6rem, 4.6vw, 3.4rem)",
            lineHeight: 1.22,
            letterSpacing: "-0.03em",
          }}
        >
          Nothing here.
        </h1>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "12px",
            border: "1px solid rgba(255, 255, 255, 0.5)",
            borderRadius: "999px",
            padding: "15px 26px 14px",
            fontFamily: "var(--ff-body)", fontStretch: "87.5%",
            fontSize: "12px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}
        >
          Back home →
        </Link>
      </div>
    </main>
  );
}
