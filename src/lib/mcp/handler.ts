import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { trace, SpanKind, SpanStatusCode } from "@opentelemetry/api";
import { getToolsByActions, type ToolDefinition } from "./tools";
import { z } from "zod";
import { recordAudit } from "../audit";
import { OAuthTokenError, revokeConnectionWithNotification } from "../oauth-token-lifecycle";

const tracer = trace.getTracer("scopegate");

export function createMcpServerForEndpoint(
  endpointId: string,
  endpointName: string,
  allowedActions: string[],
  serviceConnectionId: string
) {
  const server = new McpServer({
    name: `ScopeGate — ${endpointName}`,
    version: "1.0.0",
  });

  const tools = getToolsByActions(allowedActions);

  for (const tool of tools) {
    registerTool(server, tool, endpointId, serviceConnectionId);
  }

  return server;
}

function registerTool(
  server: McpServer,
  tool: ToolDefinition,
  endpointId: string,
  serviceConnectionId: string
) {
  const shape = getZodShape(tool.inputSchema);

  server.tool(
    tool.name,
    tool.description,
    shape,
    async (params) => {
      return tracer.startActiveSpan(
        `mcp.tool ${tool.name}`,
        {
          kind: SpanKind.INTERNAL,
          attributes: {
            "mcp.tool": tool.name,
            "mcp.action": tool.action,
            "http.route": "/api/mcp/[apiKey]",
          },
        },
        async (toolSpan) => {
          const startTime = Date.now();
          const timeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Tool execution timed out after 30s`)), 30_000)
          );
          try {
            const result = await Promise.race([
              tool.handler(params as Record<string, unknown>, { serviceConnectionId }),
              timeout,
            ]);
            const duration = Date.now() - startTime;

            console.log(
              JSON.stringify({ tool: tool.name, action: tool.action, status: "success", duration_ms: duration })
            );

            try {
              await recordAudit({
                endpointId,
                action: tool.action,
                params: params as Record<string, unknown>,
                status: "success",
                duration,
              });
            } catch {
              // Best-effort — audit write failure must not cancel a successful tool result.
            }

            return {
              content: [
                { type: "text" as const, text: JSON.stringify(result, null, 2) },
              ],
            };
          } catch (err) {
            const duration = Date.now() - startTime;
            const fullError =
              err instanceof Error ? err.message : "Unknown error";

            console.log(
              JSON.stringify({ tool: tool.name, action: tool.action, status: "error", duration_ms: duration, error: fullError })
            );
            console.error(`[ScopeGate] Tool ${tool.name} failed:`, fullError);

            const isTokenError = err instanceof OAuthTokenError;

            if (isTokenError) {
              try {
                await revokeConnectionWithNotification(serviceConnectionId, fullError);
              } catch (updateErr) {
                console.error("[ScopeGate] Failed to update connection status:", updateErr);
              }
            } else {
              toolSpan.setStatus({ code: SpanStatusCode.ERROR, message: fullError });
            }

            try {
              await recordAudit({
                endpointId,
                action: tool.action,
                params: params as Record<string, unknown>,
                status: "error",
                error: fullError,
                duration,
              });
            } catch {
              // Audit write failure must not propagate out of the catch block —
              // the MCP SDK can catch it at the protocol layer but the error
              // response content would be swallowed, leaving the client hanging.
            }

            const userMessage = isTokenError
              ? "Error: Service connection token expired or invalid. Please reconnect the service."
              : "Error: Tool execution failed";

            return {
              content: [{ type: "text" as const, text: userMessage }],
              isError: true,
            };
          } finally {
            toolSpan.end();
          }
        }
      );
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
