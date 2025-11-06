import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zapfile - Quick File Sharing for Claude Code",
  description: "Upload files and share them instantly with Claude Code Web",
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body>{children}</body>
    </html>
  );
}
