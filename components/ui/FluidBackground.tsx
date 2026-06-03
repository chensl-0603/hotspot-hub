export default function FluidBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[oklch(0.18_0.02_180)]">
      <div
        className="absolute inset-0 opacity-[0.55]"
        style={{
          backgroundImage: [
            "radial-gradient(ellipse 60% 80% at 12% 18%, oklch(0.34 0.08 175) 0%, transparent 55%)",
            "radial-gradient(ellipse 70% 60% at 92% 88%, oklch(0.30 0.07 150) 0%, transparent 55%)",
            "radial-gradient(ellipse 50% 50% at 75% 12%, oklch(0.28 0.06 120) 0%, transparent 60%)",
          ].join(","),
        }}
      />

      <div
        className="absolute inset-0 mix-blend-overlay opacity-[0.45]"
        style={{
          background:
            "conic-gradient(from 200deg at 50% 120%, oklch(0.28 0.08 170) 0deg, oklch(0.22 0.05 200) 90deg, oklch(0.20 0.04 140) 180deg, oklch(0.30 0.07 160) 270deg, oklch(0.28 0.08 170) 360deg)",
        }}
      />

      <div
        className="absolute inset-0 opacity-[0.22] mix-blend-soft-light pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.95  0 0 0 0 0.97  0 0 0 0 0.92  0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
          backgroundSize: "240px 240px",
        }}
      />

      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[oklch(0.14_0.02_180)] to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[oklch(0.14_0.02_180)/0.6] to-transparent pointer-events-none" />
    </div>
  );
}
