import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSpan = vi.hoisted(() => ({
  recordException: vi.fn(),
  setStatus: vi.fn(),
}));

const mockAuthHandler = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({
  auth: {
    handler: mockAuthHandler,
  },
}));

vi.mock("@opentelemetry/api", () => ({
  SpanStatusCode: { ERROR: 2 },
  trace: {
    getActiveSpan: vi.fn(() => mockSpan),
  },
}));

import { GET, POST } from "../route";

describe("auth catch-all route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes through successful Better Auth responses", async () => {
    mockAuthHandler.mockResolvedValue(Response.json({ ok: true }, { status: 200 }));

    const response = await GET(new Request("http://localhost/api/auth/get-session"));

    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(response.status).toBe(200);
  });

  it("returns a non-500 response when the auth handler throws", async () => {
    const error = new Error("database connection reset");
    mockAuthHandler.mockRejectedValue(error);

    const response = await POST(
      new Request("http://localhost/api/auth/sign-in/email", { method: "POST" })
    );

    await expect(response.json()).resolves.toEqual({
      error: "Authentication service temporarily unavailable",
    });
    expect(response.status).toBe(503);
    expect(mockSpan.recordException).toHaveBeenCalledWith(error);
    expect(mockSpan.setStatus).toHaveBeenCalledWith({
      code: 2,
      message: "database connection reset",
    });
  });
});
