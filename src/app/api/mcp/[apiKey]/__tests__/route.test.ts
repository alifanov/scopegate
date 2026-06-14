import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
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

import { GET } from "../route";
import { db } from "@/lib/db";
import { resetInvalidMcpApiKeyRateLimitsForTest } from "@/lib/mcp/api-keys";

const mockEndpointFindUnique = vi.mocked(db.mcpEndpoint.findUnique);

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
});
