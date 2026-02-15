import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getToolsByActions, type ToolDefinition } from "./tools";
import { db } from "../db";
import { z } from "zod";

export function createMcpServerForEndpoint(
  endpointId: string,
  endpointName: string,
  allowedActions: string[]
) {
  const server = new McpServer({
    name: `ScopeGate — ${endpointName}`,
    version: "1.0.0",
  });

  const tools = getToolsByActions(allowedActions);

  for (const tool of tools) {
    registerTool(server, tool, endpointId);
  }

  return server;
}

function registerTool(
  server: McpServer,
  tool: ToolDefinition,
  endpointId: string
) {
  const shape = getZodShape(tool.inputSchema);

  server.tool(
    tool.name,
    tool.description,
    shape,
    async (params) => {
      const startTime = Date.now();
      try {
        const result = await tool.handler(params as Record<string, unknown>);
        const duration = Date.now() - startTime;

        // Log to audit
        await db.auditLog.create({
          data: {
            endpointId,
            action: tool.action,
            params: JSON.parse(JSON.stringify(params)),
            status: "success",
            duration,
          },
        });

        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      } catch (err) {
        const duration = Date.now() - startTime;
        const errorMsg =
          err instanceof Error ? err.message : "Unknown error";

        await db.auditLog.create({
          data: {
            endpointId,
            action: tool.action,
            params: JSON.parse(JSON.stringify(params)),
            status: "error",
            error: errorMsg,
            duration,
          },
        });

        return {
          content: [{ type: "text" as const, text: `Error: ${errorMsg}` }],
          isError: true,
        };
      }
    }
  );
}

function getZodShape(
  schema: z.ZodType
): Record<string, z.ZodType> {
  if (schema instanceof z.ZodObject) {
    return schema.shape as Record<string, z.ZodType>;
  }
  return {};
}
