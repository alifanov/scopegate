import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { serviceFetch } from "@/lib/mcp/service-fetch";
import { safeFetch } from "@/lib/mcp/safe-fetch";

const span = {
  setAttribute: vi.fn(),
};

vi.mock("@opentelemetry/api", () => ({
  trace: {
    getActiveSpan: vi.fn(() => span),
  },
}));

vi.mock("@/lib/mcp/service-fetch", () => ({
  serviceFetch: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    serviceConnection: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/mcp/safe-fetch", () => ({
  safeFetch: vi.fn(),
}));

vi.mock("@/lib/oauth-token-lifecycle", () => ({
  getValidAccessToken: vi.fn(),
}));

import {
  LINKEDIN_CREATE_POST_TIMEOUT_MS,
  LINKEDIN_DEFAULT_TIMEOUT_MS,
  LINKEDIN_UPLOAD_TIMEOUT_MS,
  getLinkedInMemberUrn,
  linkedinFetch,
  linkedinUploadDocument,
  linkedinUploadImage,
} from "../linkedin";
import { getValidAccessToken } from "@/lib/oauth-token-lifecycle";

describe("linkedinFetch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.serviceConnection.findUnique).mockResolvedValue(null);
  });

  it("uses the short create-post timeout and records a single attempt for POST", async () => {
    vi.mocked(serviceFetch).mockResolvedValue(
      new Response(null, {
        status: 201,
        headers: { "x-restli-id": "urn:li:share:1" },
      })
    );

    await expect(
      linkedinFetch("conn-1", "/posts", {
        method: "POST",
        body: JSON.stringify({ commentary: "hello" }),
        timeout: LINKEDIN_CREATE_POST_TIMEOUT_MS,
      })
    ).resolves.toEqual({ success: true, id: "urn:li:share:1" });

    expect(serviceFetch).toHaveBeenCalledWith(
      "conn-1",
      "/posts",
      expect.objectContaining({
        method: "POST",
        timeout: LINKEDIN_CREATE_POST_TIMEOUT_MS,
        retry: false,
        onAttempt: expect.any(Function),
      })
    );
  });

  it("returns a clear LinkedIn timeout error", async () => {
    const err = new Error("Request timed out");
    err.name = "TimeoutError";
    vi.mocked(serviceFetch).mockRejectedValue(err);

    await expect(
      linkedinFetch("conn-1", "/posts", {
        method: "POST",
        timeout: LINKEDIN_CREATE_POST_TIMEOUT_MS,
      })
    ).rejects.toThrow(
      `LinkedIn API timed out (>${LINKEDIN_CREATE_POST_TIMEOUT_MS}ms). The service may be temporarily slow - please try again.`
    );
  });

  it("delegates GET retries and attempt recording to serviceFetch", async () => {
    vi.mocked(serviceFetch).mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    );

    await expect(linkedinFetch("conn-1", "/posts/abc")).resolves.toEqual({ ok: true });

    expect(serviceFetch).toHaveBeenCalledTimes(1);
    expect(serviceFetch).toHaveBeenCalledWith(
      "conn-1",
      "/posts/abc",
      expect.objectContaining({
        timeout: LINKEDIN_DEFAULT_TIMEOUT_MS,
        retry: true,
        onAttempt: expect.any(Function),
      })
    );
  });

  it("uses the stored LinkedIn member URN without calling /userinfo", async () => {
    vi.mocked(db.serviceConnection.findUnique).mockResolvedValue({
      metadata: { linkedinMemberUrn: "urn:li:person:abc123" },
    } as never);

    await expect(getLinkedInMemberUrn("conn-with-metadata")).resolves.toBe(
      "urn:li:person:abc123"
    );

    expect(safeFetch).not.toHaveBeenCalled();
    expect(db.serviceConnection.update).not.toHaveBeenCalled();
  });

  it("backfills the LinkedIn member URN metadata after the fallback /userinfo call", async () => {
    vi.mocked(serviceFetch).mockResolvedValue(
      new Response(JSON.stringify({ sub: "new-sub" }), { status: 200 })
    );

    await expect(getLinkedInMemberUrn("conn-without-metadata")).resolves.toBe(
      "urn:li:person:new-sub"
    );

    expect(serviceFetch).toHaveBeenCalledWith(
      "conn-without-metadata",
      "/userinfo",
      expect.objectContaining({ timeout: LINKEDIN_DEFAULT_TIMEOUT_MS, baseUrlKey: "v2" })
    );
    expect(db.serviceConnection.update).toHaveBeenCalledWith({
      where: { id: "conn-without-metadata" },
      data: { metadata: { linkedinMemberUrn: "urn:li:person:new-sub" } },
    });
  });
});

describe("linkedin binary upload timeout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.serviceConnection.findUnique).mockResolvedValue({
      metadata: { linkedinMemberUrn: "urn:li:person:abc123" },
    } as never);
    vi.mocked(getValidAccessToken).mockResolvedValue("token-1");
  });

  it("linkedinUploadImage passes a timeout to the binary safeFetch PUT", async () => {
    vi.mocked(serviceFetch).mockResolvedValue(
      new Response(JSON.stringify({ value: { uploadUrl: "https://up.example/x", image: "urn:li:image:1" } }), {
        status: 200,
      })
    );
    vi.mocked(safeFetch).mockResolvedValue(new Response(null, { status: 201 }));

    await expect(
      linkedinUploadImage("conn-1", Buffer.from("data"), "image/png")
    ).resolves.toBe("urn:li:image:1");

    expect(safeFetch).toHaveBeenCalledWith(
      "https://up.example/x",
      expect.objectContaining({ method: "PUT", timeout: LINKEDIN_UPLOAD_TIMEOUT_MS })
    );
  });

  it("linkedinUploadDocument passes a timeout to the binary safeFetch PUT", async () => {
    vi.mocked(serviceFetch).mockResolvedValue(
      new Response(JSON.stringify({ value: { uploadUrl: "https://up.example/y", document: "urn:li:document:1" } }), {
        status: 200,
      })
    );
    vi.mocked(safeFetch).mockResolvedValue(new Response(null, { status: 201 }));

    await expect(
      linkedinUploadDocument("conn-1", Buffer.from("data"), "application/pdf")
    ).resolves.toBe("urn:li:document:1");

    expect(safeFetch).toHaveBeenCalledWith(
      "https://up.example/y",
      expect.objectContaining({ method: "PUT", timeout: LINKEDIN_UPLOAD_TIMEOUT_MS })
    );
  });

  it("propagates a TimeoutError from the binary upload safeFetch call", async () => {
    vi.mocked(serviceFetch).mockResolvedValue(
      new Response(JSON.stringify({ value: { uploadUrl: "https://up.example/z", image: "urn:li:image:2" } }), {
        status: 200,
      })
    );
    const err = new Error(`Request timed out after ${LINKEDIN_UPLOAD_TIMEOUT_MS}ms`);
    err.name = "TimeoutError";
    vi.mocked(safeFetch).mockRejectedValue(err);

    await expect(
      linkedinUploadImage("conn-1", Buffer.from("data"), "image/png")
    ).rejects.toThrow("Request timed out");
  });
});
