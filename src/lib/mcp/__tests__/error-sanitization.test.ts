import { describe, it, expect, vi, beforeEach } from "vitest";
import { serviceFetch } from "@/lib/mcp/service-fetch";

// Mock serviceFetch before importing the module under test
vi.mock("@/lib/mcp/service-fetch", () => ({
  serviceFetch: vi.fn(),
}));

import { googleCalendarFetch } from "../google-calendar";

describe("googleCalendarFetch – error sanitization (Fix 5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("on API error, throws generic message without leaked details", async () => {
    vi.mocked(serviceFetch).mockResolvedValue(
      new Response(
        JSON.stringify({ error: { message: "SECRET_INTERNAL_DETAILS", code: 403 } }),
        { status: 403, statusText: "Forbidden" }
      )
    );

    await expect(
      googleCalendarFetch("conn-1", "/calendars/primary/events")
    ).rejects.toThrow("Google Calendar API request failed");

    // Verify error message does NOT contain internal details
    try {
      await googleCalendarFetch("conn-1", "/calendars/primary/events");
    } catch (e) {
      expect((e as Error).message).not.toContain("SECRET_INTERNAL_DETAILS");
      expect((e as Error).message).not.toContain("403");
    }
  });

  it("on success, returns parsed JSON", async () => {
    vi.mocked(serviceFetch).mockResolvedValue(
      new Response(JSON.stringify({ items: [{ id: "evt1", summary: "Meeting" }] }), {
        status: 200,
      })
    );

    const result = await googleCalendarFetch("conn-1", "/calendars/primary/events");
    expect(result).toEqual({ items: [{ id: "evt1", summary: "Meeting" }] });
  });

  it("on 204 No Content, returns { success: true }", async () => {
    vi.mocked(serviceFetch).mockResolvedValue(new Response(null, { status: 204 }));

    const result = await googleCalendarFetch("conn-1", "/calendars/primary/events/evt1");
    expect(result).toEqual({ success: true });
  });
});
