"use client";

export function GrainLayer() {
  return (
    <div
      aria-hidden
      className="
        pointer-events-none fixed inset-0
        z-10 opacity-[var(--grain-opacity,0.35)]
        bg-repeat
        [background-image:url('/textures/grain.png')]
        mix-blend-overlay
      "
    />
  );
}
