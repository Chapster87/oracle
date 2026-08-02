import React from "react";
import "./globals.css";

export const metadata = {
  title: "Oracle DM Assistant",
  description: "Next.js App Shell Prototype",
};

/**
 * Root layout component for the application.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
