import React from "react"

import "../styles/globals.css"

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
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
