import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DESCRIPTION =
  "Per-agent permissions for MCP & OAuth — choose exactly which tools, scopes, and data each agent can touch. Instant revocation, full audit trail.";

export const metadata: Metadata = {
  metadataBase: new URL("https://scopegate.dev"),
  title: {
    default: "Control What Each AI Agent Can Access — ScopeGate",
    template: "%s | ScopeGate",
  },
  description: DESCRIPTION,
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Control What Each AI Agent Can Access — ScopeGate",
    description: DESCRIPTION,
    url: "https://scopegate.dev",
    siteName: "ScopeGate",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ScopeGate — AI Access Proxy Layer",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Control What Each AI Agent Can Access — ScopeGate",
    description: DESCRIPTION,
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
