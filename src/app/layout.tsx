import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "3D Chess — Multiplayer Chess Experience",
  description:
    "A stunning 3D multiplayer chess application with AI opponents, real-time gameplay, and beautiful glassmorphic aesthetics. Play locally, against Stockfish AI, or online.",
  keywords: ["chess", "3D chess", "multiplayer", "Stockfish", "AI", "WebGL"],
  openGraph: {
    title: "3D Chess",
    description: "Play chess in stunning 3D. Local, AI, and multiplayer modes.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0a0f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
