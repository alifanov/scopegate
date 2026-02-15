import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { db } from "@/lib/db";
import { createMcpServerForEndpoint } from "@/lib/mcp/handler";

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
    allowedActions
  );

  // Create stateless transport for this request
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  await server.connect(transport);

  const response = await transport.handleRequest(request);

  return response;
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
