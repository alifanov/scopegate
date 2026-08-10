import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { SeverityNumber, type LogRecord, type Logger } from "@opentelemetry/api-logs";
import { bridgeConsoleToOtelLogs } from "@/lib/otel-console-bridge";

function fakeLogger(records: LogRecord[]): Logger {
  return {
    emit: (record: LogRecord) => {
      records.push(record);
    },
  } as unknown as Logger;
}

describe("bridgeConsoleToOtelLogs", () => {
  const originals = {
    error: console.error,
    warn: console.warn,
    info: console.info,
    log: console.log,
  };

  beforeEach(() => {
    console.error = vi.fn();
    console.warn = vi.fn();
    console.info = vi.fn();
    console.log = vi.fn();
  });

  afterEach(() => {
    Object.assign(console, originals);
  });

  it("emits a log record per bridged level with formatted body", () => {
    const records: LogRecord[] = [];
    bridgeConsoleToOtelLogs(fakeLogger(records));

    console.error("boom %s", 42);
    console.warn("careful");
    console.info("hello");

    expect(records).toEqual([
      {
        severityNumber: SeverityNumber.ERROR,
        severityText: "ERROR",
        body: "boom 42",
      },
      {
        severityNumber: SeverityNumber.WARN,
        severityText: "WARN",
        body: "careful",
      },
      {
        severityNumber: SeverityNumber.INFO,
        severityText: "INFO",
        body: "hello",
      },
    ]);
  });

  it("leaves console.log unbridged", () => {
    const records: LogRecord[] = [];
    bridgeConsoleToOtelLogs(fakeLogger(records));

    console.log("debug noise");

    expect(records).toHaveLength(0);
  });

  it("does not recurse when the logger itself calls console.error", () => {
    const records: LogRecord[] = [];
    const loopingLogger = {
      emit: (record: LogRecord) => {
        records.push(record);
        console.error("exporter failed");
      },
    } as unknown as Logger;
    bridgeConsoleToOtelLogs(loopingLogger);

    console.error("original");

    expect(records).toHaveLength(1);
    expect(records[0].body).toBe("original");
  });

  it("still writes to the underlying console when emit throws", () => {
    const underlying = console.error;
    const throwingLogger = {
      emit: () => {
        throw new Error("exporter down");
      },
    } as unknown as Logger;
    bridgeConsoleToOtelLogs(throwingLogger);

    expect(() => console.error("still printed")).not.toThrow();
    expect(underlying).toHaveBeenCalledWith("still printed");
  });
});
