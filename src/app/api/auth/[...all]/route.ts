import { auth } from "@/lib/auth";
import { SpanStatusCode, trace } from "@opentelemetry/api";

async function handleAuthRequest(request: Request) {
  try {
    return await auth.handler(request);
  } catch (error: unknown) {
    const span = trace.getActiveSpan();
    if (span) {
      span.recordException(error instanceof Error ? error : new Error(String(error)));
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : "Authentication request failed",
      });
    }

    console.error("Auth request failed", error);

    return Response.json(
      { error: "Authentication service temporarily unavailable" },
      { status: 503 }
    );
  }
}

export const GET = handleAuthRequest;
export const POST = handleAuthRequest;
