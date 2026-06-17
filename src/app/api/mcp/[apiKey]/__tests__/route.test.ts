import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSpan = vi.hoisted(() => ({
  recordException: vi.fn(),
  setAttribute: vi.fn(),
  setStatus: vi.fn(),
}));

const mockTransportHandleRequest = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  db: {
    $queryRaw: vi.fn(),
    mcpEndpoint: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/mcp/handler", () => ({
  createMcpServerForEndpoint: vi.fn(),
}));

vi.mock("@/lib/mcp/metrics", () => ({
  recordMcpInvalidRequest: vi.fn(),
}));

vi.mock("@opentelemetry/api", () => ({
  SpanStatusCode: { ERROR: 2 },
  trace: {
    getActiveSpan: vi.fn(() => mockSpan),
  },
}));

vi.mock("@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js", () => ({
  WebStandardStreamableHTTPServerTransport: class {
    handleRequest = mockTransportHandleRequest;
  },
}));

import { GET, POST } from "../route";
import { db } from "@/lib/db";
import { resetInvalidMcpApiKeyRateLimitsForTest } from "@/lib/mcp/api-keys";
import { createMcpServerForEndpoint } from "@/lib/mcp/handler";

const mockQueryRaw = vi.mocked(db.$queryRaw);
const mockEndpointFindUnique = vi.mocked(db.mcpEndpoint.findUnique);
const mockCreateMcpServerForEndpoint = vi.mocked(createMcpServerForEndpoint);

function makeParams(apiKey: string) {
  return { params: Promise.resolve({ apiKey }) };
}

function makeRequest(ip: string) {
  return new Request("http://localhost/api/mcp/not-a-real-key", {
    headers: { "x-forwarded-for": ip },
  });
}

describe("MCP route invalid API key throttling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetInvalidMcpApiKeyRateLimitsForTest();
    mockEndpointFindUnique.mockResolvedValue(null as never);
    mockQueryRaw.mockResolvedValue([{ count: 1 }] as never);
    mockCreateMcpServerForEndpoint.mockReturnValue({
      connect: vi.fn().mockResolvedValue(undefined),
    } as never);
    mockTransportHandleRequest.mockResolvedValue(new Response(null, { status: 200 }));
  });

  it("rate limits repeated invalid API key attempts by client IP", async () => {
    let response = new Response(null, { status: 500 });

    for (let i = 0; i < 31; i += 1) {
      response = await GET(makeRequest("203.0.113.10"), makeParams(`bad-${i}`));
    }

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBeTruthy();
  });

  it("blocks an over-limit IP before another API key lookup", async () => {
    for (let i = 0; i < 31; i += 1) {
      await GET(makeRequest("203.0.113.10"), makeParams(`bad-${i}`));
    }
    mockEndpointFindUnique.mockClear();

    const response = await GET(makeRequest("203.0.113.10"), makeParams("bad-31"));

    expect(response.status).toBe(429);
    expect(mockEndpointFindUnique).not.toHaveBeenCalled();
  });

  it("keeps invalid API key attempts isolated per client IP", async () => {
    for (let i = 0; i < 30; i += 1) {
      await GET(makeRequest("203.0.113.10"), makeParams(`bad-${i}`));
    }

    const response = await GET(
      makeRequest("203.0.113.11"),
      makeParams("bad-other-ip")
    );

    expect(response.status).toBe(401);
  });

  it("records route-level transport failures on the active span", async () => {
    mockEndpointFindUnique.mockResolvedValue({
      id: "endpoint-1",
      name: "Production",
      isActive: true,
      rateLimitPerMinute: 60,
      serviceConnectionId: "connection-1",
      permissions: [{ action: "openrouter_get_credits" }],
      serviceConnection: {},
    } as never);
    mockTransportHandleRequest.mockRejectedValue(new Error("transport exploded"));

    const response = await POST(
      new Request("http://localhost/api/mcp/sg_valid", { method: "POST" }),
      makeParams("sg_valid")
    );

    await expect(response.json()).resolves.toEqual({ error: "MCP request failed" });
    expect(response.status).toBe(500);
    expect(mockSpan.recordException).toHaveBeenCalledWith(expect.any(Error));
    expect(mockSpan.setStatus).toHaveBeenCalledWith({
      code: 2,
      message: "transport exploded",
    });
  });
});
