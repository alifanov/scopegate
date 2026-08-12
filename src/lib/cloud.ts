// Cloud vs self-hosted mode — the single switch that separates the hosted
// offering (landing page, paid plans, plan limits) from the open-source
// self-hosted deployment, which stays unlimited and invite-only.
//
// Deliberately NOT a NEXT_PUBLIC_* var: those are inlined into the bundle at
// `next build`, and one image is built once and deployed to both targets with
// only env vars differing. Server-only — pass the value into client components
// as a prop, the way (dashboard)/layout.tsx passes isAdmin into <Sidebar>.
//
// A function, not a const, so the value is read per call instead of being
// captured at module import time (which would make it untestable and would
// break if the env is populated after module init).
export function isCloud(): boolean {
  return process.env.SCOPEGATE_CLOUD === "1";
}
