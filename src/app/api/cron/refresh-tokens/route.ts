import { NextResponse } from "next/server";
import { refreshExpiringConnectionTokens } from "@/lib/token-refresh";
import { checkCronAuth } from "@/lib/cron-auth";

export async function POST(request: Request) {
  const auth = checkCronAuth(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  return NextResponse.json(await refreshExpiringConnectionTokens());
}
