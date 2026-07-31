import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// ponytail: liveness only — no DB ping, a DB blip must not take the container
// out of rotation. Add a `?deep=1` DB check if readiness ever needs it.
export function GET() {
  return NextResponse.json({ status: "ok" });
}
