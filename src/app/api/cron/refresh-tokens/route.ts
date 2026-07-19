import { NextResponse } from "next/server";
import { SpanStatusCode, trace } from "@opentelemetry/api";
import { refreshExpiringConnectionTokens } from "@/lib/token-refresh";
import { checkCronAuth } from "@/lib/cron-auth";

export async function POST(request: Request) {
  const auth = checkCronAuth(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    return NextResponse.json(await refreshExpiringConnectionTokens());
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown cron error";
    const stack = err instanceof Error ? (err.stack ?? "").split("\n").slice(0, 5).join("\n") : undefined;
    const span = trace.getActiveSpan();
    span?.recordException(err instanceof Error ? err : new Error(message));
    span?.setStatus({ code: SpanStatusCode.ERROR, message });

    console.error(
      JSON.stringify({
        event: "cron.refresh_tokens_error",
        route: "/api/cron/refresh-tokens",
        error: message,
        ...(stack ? { stack } : {}),
      })
    );

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
