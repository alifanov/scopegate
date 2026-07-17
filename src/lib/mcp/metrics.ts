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

// "success_after_retry" and "partial_success" are the two outcomes that push a threads
// publish_thread call toward its total time budget (retry adds a confirmPublished poll +
// backoff per attempt; partial_success means the deadline was hit outright). Neither shows
// up in the error rate, so without this counter their frequency is invisible until p99 is
// already close to the budget ceiling.
export type ThreadsPublishOutcome = "success_after_retry" | "partial_success";

export function recordThreadsPublishOutcome(outcome: ThreadsPublishOutcome): void {
  metrics
    .getMeter("scopegate")
    .createCounter("threads.publish_outcome", {
      description:
        "threads:publish_thread calls that took the slow path — retried after a transient error, or ran out of budget before Meta finished processing",
    })
    .add(1, { outcome });
}
