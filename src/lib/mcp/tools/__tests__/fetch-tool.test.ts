import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createFetchTool } from "../fetch-tool";

describe("createFetchTool", () => {
  it("appends query params, skipping undefined values", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true });
    const tool = createFetchTool(fetcher, {
      name: "t",
      description: "d",
      action: "t:a",
      inputSchema: z.object({}),
      path: "/things",
      query: (params) => ({ limit: 10, filter: params.filter as string | undefined }),
    });

    await tool.handler({}, { serviceConnectionId: "conn-1" });

    expect(fetcher).toHaveBeenCalledWith("conn-1", "/things?limit=10", undefined);
  });

  it("merges query params onto a path that already has one", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true });
    const tool = createFetchTool(fetcher, {
      name: "t",
      description: "d",
      action: "t:a",
      inputSchema: z.object({}),
      path: "/things?existing=1",
      query: () => ({ limit: 10 }),
    });

    await tool.handler({}, { serviceConnectionId: "conn-1" });

    expect(fetcher).toHaveBeenCalledWith("conn-1", "/things?existing=1&limit=10", undefined);
  });

  it("passes formData through in the options alongside method", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true });
    const tool = createFetchTool(fetcher, {
      name: "t",
      description: "d",
      action: "t:a",
      inputSchema: z.object({}),
      path: "/customers",
      method: "POST",
      formData: (params) => ({ email: params.email as string }),
    });

    await tool.handler({ email: "a@b.com" }, { serviceConnectionId: "conn-1" });

    expect(fetcher).toHaveBeenCalledWith("conn-1", "/customers", {
      method: "POST",
      formData: { email: "a@b.com" },
    });
  });
});
