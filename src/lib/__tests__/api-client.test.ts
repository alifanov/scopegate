import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiGet, apiSend } from "../api-client";

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiGet", () => {
  it("returns parsed JSON on 200", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(200, { ok: true })));
    await expect(apiGet("/api/x")).resolves.toEqual({ ok: true });
  });

  it("returns undefined on 204", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    await expect(apiGet("/api/x")).resolves.toBeUndefined();
  });

  it.each([
    [400, { error: "Bad input" }, "Bad input"],
    [401, {}, "You need to sign in again"],
    [403, {}, "You don't have access to this resource"],
    [404, {}, "Not found"],
    [500, {}, "Server error — please try again"],
    [502, { error: "" }, "Server error — please try again"],
  ])("status %i -> message %j -> %s", async (status, body, message) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(status, body)));
    const err = await apiGet("/api/x").catch((e: ApiError) => e) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(status);
    expect(err.message).toBe(message);
  });

  it("falls back to a status-based message on invalid JSON body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("<html>not json</html>", { status: 500 }))
    );
    const err = await apiGet("/api/x").catch((e: ApiError) => e) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(500);
    expect(err.message).toBe("Server error — please try again");
  });

  it("throws ApiError with status 0 on network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    const err = await apiGet("/api/x").catch((e: ApiError) => e) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(0);
    expect(err.message).toBe("Network error — check your connection");
  });
});

describe("apiSend", () => {
  it("sends JSON body with Content-Type when a body is given", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await apiSend("/api/x", "POST", { a: 1 });

    expect(fetchMock).toHaveBeenCalledWith("/api/x", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ a: 1 }),
    });
  });

  it("omits body and Content-Type when no body is given", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await apiSend("/api/x", "DELETE");

    expect(fetchMock).toHaveBeenCalledWith("/api/x", {
      method: "DELETE",
      headers: undefined,
      body: undefined,
    });
  });
});
