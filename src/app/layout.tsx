import React from "react"

import "../styles/globals.css"

import BreakpointIndicator from "@components/breakpoint-indicator"

import AppShell from "./app-shell"

/**
 * Root layout. Stays a server component so Next.js owns the `<html>`/`<body>`
 * and its streaming script injection; the interactive shell lives in
 * `AppShell`.
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
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
