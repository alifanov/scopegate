import type { Metadata } from "next";
import { MagicLinkClient } from "./magic-link-client";

export const metadata: Metadata = {
  title: "Sign In — ScopeGate",
  description: "Complete your sign-in to ScopeGate via magic link.",
};

export default function MagicLinkPage() {
  return <MagicLinkClient />;
}
