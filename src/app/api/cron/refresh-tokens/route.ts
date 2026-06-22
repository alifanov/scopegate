import { NextResponse } from "next/server";
import { refreshExpiringConnectionTokens } from "@/lib/token-refresh";

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("authorization")?.replace(/\s+/g, " ").trim();
  const expected = `Bearer ${cronSecret.trim()}`;
  if (authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(await refreshExpiringConnectionTokens());
}
