import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { db } from "@/lib/db";
import { createMcpServerForEndpoint } from "@/lib/mcp/handler";

// SSE connections are long-lived by design (MCP Streamable HTTP spec).
// p99 ≈ 299 s is the reverse-proxy idle timeout, not an app bug.
// Keep-alive comments sent every 30 s prevent Traefik/nginx from dropping idle connections.
// maxDuration tells Next.js/Vercel the expected maximum connection duration.
export const maxDuration = 300;

function withSseKeepAlive(response: Response, intervalMs = 30_000): Response {
  if (!response.body) return response;
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

async function handleMcpRequest(
  request: Request,
  apiKey: string
): Promise<Response> {
  // Look up endpoint by API key
  const endpoint = await db.mcpEndpoint.findUnique({
    where: { apiKey },
    include: {
      permissions: { select: { action: true } },
      serviceConnection: true,
    },
  });

  if (!endpoint) {
    return new Response(JSON.stringify({ error: "Invalid API key" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!endpoint.isActive) {
    return new Response(
      JSON.stringify({ error: "Endpoint is deactivated" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  // Rate limit check
  const oneMinuteAgo = new Date(Date.now() - 60_000);
  const recentCalls = await db.auditLog.count({
    where: {
      endpointId: endpoint.id,
      createdAt: { gte: oneMinuteAgo },
    },
  });

  if (recentCalls >= endpoint.rateLimitPerMinute) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }

  const allowedActions = endpoint.permissions.map((p) => p.action);
  const server = createMcpServerForEndpoint(
    endpoint.id,
    endpoint.name,
    allowedActions,
    endpoint.serviceConnectionId
  );

  // Create stateless transport for this request
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  await server.connect(transport);

  const response = await transport.handleRequest(request);

  return withSseKeepAlive(response);
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
