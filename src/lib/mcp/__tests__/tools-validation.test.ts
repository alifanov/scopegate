import { describe, it, expect } from "vitest";
import { TOOL_DEFINITIONS } from "../tools";

function getEventIdSchema(toolName: string) {
  const tool = TOOL_DEFINITIONS.find((t) => t.name === toolName);
  if (!tool) throw new Error(`Tool ${toolName} not found`);
  return tool.inputSchema;
}

describe("tools – path injection validation (Fix 2)", () => {
  const toolNames = ["calendar_update_event", "calendar_delete_event"];

  for (const toolName of toolNames) {
    describe(`${toolName} eventId validation`, () => {
      const schema = getEventIdSchema(toolName);

      it("accepts valid alphanumeric event IDs", () => {
        for (const id of ["abc123", "event_1", "my-event-id", "ABC", "a1_b2-c3"]) {
          const result = schema.safeParse({ eventId: id });
          expect(result.success).toBe(true);
        }
      });

      it("rejects path traversal attempts", () => {
        for (const id of ["../../etc/passwd", "../other", "a/../b"]) {
          const result = schema.safeParse({ eventId: id });
          expect(result.success).toBe(false);
        }
      });

      it("rejects special characters", () => {
        for (const id of ["event/123", "event id", "event;rm", "event&cmd", "event\nnewline"]) {
          const result = schema.safeParse({ eventId: id });
          expect(result.success).toBe(false);
        }
      });

      it("rejects empty string", () => {
        const result = schema.safeParse({ eventId: "" });
        expect(result.success).toBe(false);
      });
    });
  }
});
