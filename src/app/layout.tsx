import { MailIcon } from "lucide-react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { isCloud } from "@/lib/cloud";
import { OG_DEFAULTS } from "@/lib/og";
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
    ...OG_DEFAULTS,
    title: "Control What Each AI Agent Can Access — ScopeGate",
    description: DESCRIPTION,
    url: "https://scopegate.dev",
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
        {isCloud() && (
          <a
            href="mailto:hello@scopegate.dev"
            aria-label="Contact us by email"
            title="Contact us"
            className="fixed bottom-5 right-5 z-50 hidden size-12 cursor-pointer items-center justify-center rounded-full bg-violet-600 text-white shadow-lg transition-colors hover:bg-violet-500 md:flex"
          >
            <MailIcon className="size-5" />
          </a>
        )}
        <Toaster />
      </body>
    </html>
  );
}
