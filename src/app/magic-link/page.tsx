import type { Metadata } from "next";
import { MagicLinkClient } from "./magic-link-client";
import { AUTH_VIEWPORT } from "@/lib/marketing-viewport";

export const metadata: Metadata = {
  title: "Sign In — ScopeGate",
  description: "Complete your sign-in to ScopeGate via magic link.",
  robots: { index: false, follow: false },
};

export const viewport = AUTH_VIEWPORT;

export default function MagicLinkPage() {
  return <MagicLinkClient />;
}
