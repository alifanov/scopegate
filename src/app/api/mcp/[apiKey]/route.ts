import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { SpanStatusCode, trace } from "@opentelemetry/api";
import { db } from "@/lib/db";
import { createMcpServerForEndpoint } from "@/lib/mcp/handler";
import {
  getClientIp,
  getInvalidMcpApiKeyRetryAfterSeconds,
  isInvalidMcpApiKeyBlocked,
  isInvalidMcpApiKeyRateLimited,
} from "@/lib/mcp/api-keys";
import { recordMcpInvalidRequest } from "@/lib/mcp/metrics";
import { checkRateLimit } from "@/lib/mcp/rate-limit";
import { checkMonthlyUsage } from "@/lib/mcp/monthly-usage";
import { isCloud } from "@/lib/cloud";
import { getUserLimits } from "@/lib/plan-limits";
import { PROJECT_ROLE } from "@/lib/project-roles";

// SSE connections are long-lived by design (MCP Streamable HTTP spec).
// p99 ≈ 299 s is the reverse-proxy idle timeout, not an app bug.
// Keep-alive comments sent every 30 s prevent Traefik/nginx from dropping idle connections.
// maxDuration tells Next.js/Vercel the expected maximum connection duration.
export const maxDuration = 300;

// Statuses that per the Fetch spec must not carry a body — `new Response(body, { status })`
// throws "Invalid response status code" if body is non-null for these.
const NULL_BODY_STATUSES = new Set([204, 205, 304]);

export function withSseKeepAlive(response: Response, intervalMs = 30_000): Response {
  if (!response.body) return response;
  if (NULL_BODY_STATUSES.has(response.status)) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/event-stream")) return response;

  const encoder = new TextEncoder();
  const ping = encoder.encode(": ping\n\n");
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();

  const pump = async () => {
    const reader = response.body!.getReader();
    const pingTimer = setInterval(() => {
      writer.write(ping).catch(() => clearInterval(pingTimer));
    }, intervalMs);
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        await writer.write(value);
      }
    } finally {
      clearInterval(pingTimer);
      writer.close().catch(() => {});
    }
  };

  pump().catch(() => writer.close().catch(() => {}));

  return new Response(readable, { status: response.status, headers: response.headers });
}

function isDbError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const name = err.constructor.name;
  // Prisma driver errors and pg driver errors
  return (
    name.startsWith("Prisma") ||
    name === "DatabaseError" ||
    name === "PgError" ||
    ("code" in err && typeof (err as Record<string, unknown>).code === "string" && /^[0-9A-Z]{5}$/.test((err as Record<string, unknown>).code as string))
  );
}

function reportMcpRouteError(err: unknown): Response {
  const message = err instanceof Error ? err.message : "Unknown MCP route error";
  const errorType = err instanceof Error ? err.constructor.name : "UnknownError";
  const stack = err instanceof Error ? (err.stack ?? "").split("\n").slice(0, 5).join("\n") : undefined;
  const span = trace.getActiveSpan();

  span?.recordException(err instanceof Error ? err : new Error(message));
  span?.setStatus({ code: SpanStatusCode.ERROR, message });
  span?.setAttribute("error.type", errorType);

  // DB/infrastructure errors → 503 (not a 500 bug, just transient unavailability)
  const status = isDbError(err) ? 503 : 500;

  console.error(
    JSON.stringify({
      event: "mcp.route_error",
      route: "/api/mcp/[apiKey]",
      error: message,
      error_type: errorType,
      status,
      ...(stack ? { stack } : {}),
    })
  );

  return new Response(JSON.stringify({ error: status === 503 ? "Service temporarily unavailable" : "MCP request failed" }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function handleMcpRequest(
  request: Request,
  apiKey: string
): Promise<Response> {
  try {
    // Explicitly tag the active OTel span with the route pattern.
    // The http-level requestHook in instrumentation.node.ts also sets this, but in
    // production (no src/app/ present) normalizeRoute falls back to the raw URL which
    // embeds the actual API key. Setting it here on the framework-level span ensures
    // SigNoz always aggregates all MCP traffic under a single canonical route.
    trace.getActiveSpan()?.setAttribute("http.route", "/api/mcp/[apiKey]");

    const clientIp = getClientIp(request);
    if (isInvalidMcpApiKeyBlocked(clientIp)) {
      recordMcpInvalidRequest("rate_limited");
      return new Response(JSON.stringify({ error: "Too many invalid API key attempts" }), {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(getInvalidMcpApiKeyRetryAfterSeconds(clientIp)),
        },
      });
    }

    // Look up endpoint by API key
    const endpoint = await db.mcpEndpoint.findUnique({
      where: { apiKey },
      include: {
        permissions: { select: { action: true } },
        serviceConnection: true,
        // Project owner — whose plan quota this request counts against. Folded
        // into the lookup that already runs: an indexed `take: 1` subquery is
        // cheaper than a second round-trip, and simpler than a conditional
        // include, which Prisma cannot type through.
        project: {
          select: {
            teamMembers: {
              where: { role: PROJECT_ROLE.owner },
              select: { userId: true },
              take: 1,
            },
          },
        },
      },
    });

    if (!endpoint) {
      if (isInvalidMcpApiKeyRateLimited(clientIp)) {
        recordMcpInvalidRequest("rate_limited");
        return new Response(JSON.stringify({ error: "Too many invalid API key attempts" }), {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(getInvalidMcpApiKeyRetryAfterSeconds(clientIp)),
          },
        });
      }

      recordMcpInvalidRequest("unauthorized");
      return new Response(JSON.stringify({ error: "Invalid API key" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!endpoint.isActive) {
      recordMcpInvalidRequest("unauthorized");
      return new Response(
        JSON.stringify({ error: "Endpoint is deactivated" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // ponytail: fail-open on rate-limiter DB error — rate limiting is best-effort
    let rateLimit: Awaited<ReturnType<typeof checkRateLimit>> | null = null;
    try {
      rateLimit = await checkRateLimit({
        endpointId: endpoint.id,
        limitPerMinute: endpoint.rateLimitPerMinute,
      });
    } catch (rlErr) {
      console.error(
        JSON.stringify({
          event: "mcp.rate_limit_error",
          route: "/api/mcp/[apiKey]",
          error: rlErr instanceof Error ? rlErr.message : String(rlErr),
          error_type: rlErr instanceof Error ? rlErr.constructor.name : "UnknownError",
        })
      );
    }

    if (rateLimit && !rateLimit.allowed) {
      recordMcpInvalidRequest("rate_limited");
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ponytail: fail-open like the rate limiter above — a billing-DB hiccup
    // must not take the gateway down. Over-serving a quota is cheaper than an
    // outage; the monthly counter self-corrects on the next successful write.
    const ownerId = isCloud() ? endpoint.project?.teamMembers[0]?.userId : undefined;
    if (ownerId) {
      try {
        const limits = await getUserLimits(ownerId);
        const usage = await checkMonthlyUsage({
          userId: ownerId,
          limit: limits.requestsPerMonth,
        });
        if (!usage.allowed) {
          recordMcpInvalidRequest("rate_limited");
          return new Response(
            JSON.stringify({
              error:
                "Monthly request quota exceeded for this account. Upgrade your plan to continue.",
            }),
            { status: 402, headers: { "Content-Type": "application/json" } }
          );
        }
      } catch (quotaErr) {
        console.error(
          JSON.stringify({
            event: "mcp.quota_check_error",
            route: "/api/mcp/[apiKey]",
            error: quotaErr instanceof Error ? quotaErr.message : String(quotaErr),
            error_type:
              quotaErr instanceof Error ? quotaErr.constructor.name : "UnknownError",
          })
        );
      }
    }

    const allowedActions = endpoint.permissions.map((p) => p.action);
    const server = createMcpServerForEndpoint(
      endpoint.id,
      endpoint.name,
      allowedActions,
      endpoint.serviceConnectionId,
      endpoint.projectId,
      endpoint.serviceConnection.provider
    );

    // Create stateless transport for this request
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    await server.connect(transport);

    // Clone before the transport consumes the body so we can log it on 400.
    const requestClone = request.clone();
    const response = await transport.handleRequest(request);

    if (response.status === 400) {
      recordMcpInvalidRequest("invalid_format");
      const bodyPreview = await requestClone.text().catch(() => "<unreadable>");
      console.log(
        JSON.stringify({
          event: "mcp.invalid_request",
          route: "/api/mcp/[apiKey]",
          status: 400,
          body_preview: bodyPreview.slice(0, 500),
        })
      );
    }

    return withSseKeepAlive(response);
  } catch (err) {
    return reportMcpRouteError(err);
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ apiKey: string }> }
) {
  const { apiKey } = await params;
  return handleMcpRequest(request, apiKey);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ apiKey: string }> }
) {
  const { apiKey } = await params;
  return handleMcpRequest(request, apiKey);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ apiKey: string }> }
) {
  const { apiKey } = await params;
  return handleMcpRequest(request, apiKey);
}
