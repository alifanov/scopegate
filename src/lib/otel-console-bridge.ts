import { format } from "node:util";
import { logs, SeverityNumber, type Logger } from "@opentelemetry/api-logs";

// The app logs through `console.*` (no logger library), so without this bridge
// SigNoz receives spans but zero log records. Only error/warn/info are bridged —
// `console.log` is debug-level noise not worth the ingest cost.
// ponytail: patch console instead of adopting pino/winston; replace with a logger
// instrumentation if the app ever gains a real logger.
const BRIDGED_CONSOLE_LEVELS = {
  error: SeverityNumber.ERROR,
  warn: SeverityNumber.WARN,
  info: SeverityNumber.INFO,
} as const;

type BridgedLevel = keyof typeof BRIDGED_CONSOLE_LEVELS;

/**
 * Wraps console.error/warn/info so every call also emits an OTel log record.
 * Trace context is picked up from the active span by the SDK, so records carry
 * trace_id/span_id and link back to their trace.
 */
export function bridgeConsoleToOtelLogs(
  logger: Logger = logs.getLogger("console"),
): void {
  // The OTLP exporter reports its own failures via console.error — emitting a log
  // record from inside that call would loop back into the exporter.
  let emitting = false;

  for (const [level, severityNumber] of Object.entries(BRIDGED_CONSOLE_LEVELS)) {
    const original = console[level as BridgedLevel].bind(console);
    console[level as BridgedLevel] = (...args: unknown[]) => {
      original(...args);
      if (emitting) return;
      emitting = true;
      try {
        logger.emit({
          severityNumber,
          severityText: level.toUpperCase(),
          body: format(...args),
        });
      } catch {
        // never let telemetry break the caller's logging
      } finally {
        emitting = false;
      }
    };
  }
}
