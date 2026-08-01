import React from "react";

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
      <body style={{ margin: 0, padding: 0, background: "white" }}>
        {children}
      </body>
    </html>
  );
}
