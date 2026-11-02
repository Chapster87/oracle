import React from "react"

export const metadata = { title: "Link" }

export default function LinkLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
