"use client"

import * as React from "react"

export function GridBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none -z-10"
      style={{
        background:
          "radial-gradient(circle at top, hsl(35, 84%, 62%) 0%, hsl(39, 45%, 35%) 35%, hsl(44, 30%, 20%) 100%)",
      }}
    >
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)
          `,
          backgroundSize: "22px 22px",
        }}
      />
    </div>
  )
}
