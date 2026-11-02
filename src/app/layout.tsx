import React from "react"
import type { Metadata } from "next"

import "../styles/globals.css"

import BreakpointIndicator from "@components/breakpoint-indicator"

export const metadata: Metadata = {
  title: { default: "Oracle", template: "%s · Oracle" },
  description: "Campaign manager for the Shattered Isles.",
}

/**
 * Root layout. Stays a server component so Next.js owns the `<html>`/`<body>`
 * and its streaming script injection.
 *
 * The app shell and the auth gate live in `(app)/layout.tsx`; `/login` and
 * `/auth/*` render outside it.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <BreakpointIndicator />
        {children}
      </body>
    </html>
  )
}
