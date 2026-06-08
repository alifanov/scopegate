import { metrics } from "@opentelemetry/api";

export type McpErrorType = "invalid_format" | "unauthorized" | "rate_limited" | "blocked";

export function recordMcpInvalidRequest(errorType: McpErrorType): void {
  metrics
    .getMeter("scopegate")
    .createCounter("mcp.invalid_requests", {
      description:
        "MCP requests rejected before tool execution, classified by error type",
    })
    .add(1, { error_type: errorType });
}
