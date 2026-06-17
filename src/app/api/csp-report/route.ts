import { NextResponse, type NextRequest } from "next/server";
import { trace, SpanStatusCode } from "@opentelemetry/api";

// CSP violations are reported by the browser to this endpoint. Two wire formats
// exist depending on which directive the browser honoured:
//   - `report-uri`  → single JSON object: { "csp-report": { ...hyphenated keys } }
//   - `report-to`   → array of reports:   [{ type, body: { ...camelCase keys } }]
// We normalise both into one shape and route them to SigNoz (OTel span +
// structured console log) so they surface alongside the rest of our telemetry.
export const dynamic = "force-dynamic";

const tracer = trace.getTracer("scopegate/csp-report");

type NormalizedViolation = {
  blockedURI?: string;
  violatedDirective?: string;
  effectiveDirective?: string;
  documentURI?: string;
  sourceFile?: string;
  lineNumber?: number;
  columnNumber?: number;
  disposition?: string;
};

// Raw `report-uri` shape: keys are hyphenated (e.g. "blocked-uri").
function fromReportUri(report: Record<string, unknown>): NormalizedViolation {
  const num = (v: unknown) => (typeof v === "number" ? v : undefined);
  const str = (v: unknown) => (typeof v === "string" ? v : undefined);
  return {
    blockedURI: str(report["blocked-uri"]),
    violatedDirective: str(report["violated-directive"]),
    effectiveDirective: str(report["effective-directive"]),
    documentURI: str(report["document-uri"]),
    sourceFile: str(report["source-file"]),
    lineNumber: num(report["line-number"]),
    columnNumber: num(report["column-number"]),
    disposition: str(report["disposition"]),
  };
}

// Raw `report-to` body shape: keys are camelCase (e.g. "blockedURL").
function fromReportTo(body: Record<string, unknown>): NormalizedViolation {
  const num = (v: unknown) => (typeof v === "number" ? v : undefined);
  const str = (v: unknown) => (typeof v === "string" ? v : undefined);
  return {
    // Newer spec uses "blockedURL"; some agents still emit "blockedURI".
    blockedURI: str(body["blockedURL"]) ?? str(body["blockedURI"]),
    violatedDirective: str(body["effectiveDirective"]) ?? str(body["violatedDirective"]),
    effectiveDirective: str(body["effectiveDirective"]),
    documentURI: str(body["documentURL"]) ?? str(body["documentURI"]),
    sourceFile: str(body["sourceFile"]),
    lineNumber: num(body["lineNumber"]),
    columnNumber: num(body["columnNumber"]),
    disposition: str(body["disposition"]),
  };
}

function normalize(payload: unknown): NormalizedViolation[] {
  // report-to: array of { type, body }
  if (Array.isArray(payload)) {
    return payload
      .filter(
        (entry): entry is { type?: string; body?: Record<string, unknown> } =>
          !!entry && typeof entry === "object",
      )
      .filter((entry) => entry.type === undefined || entry.type === "csp-violation")
      .map((entry) =>
        fromReportTo((entry.body ?? {}) as Record<string, unknown>),
      );
  }

  // report-uri: { "csp-report": {...} }
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    const cspReport = obj["csp-report"];
    if (cspReport && typeof cspReport === "object") {
      return [fromReportUri(cspReport as Record<string, unknown>)];
    }
    // Some agents POST the bare body without the wrapper.
    return [fromReportUri(obj)];
  }

  return [];
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const userAgent = request.headers.get("user-agent") ?? undefined;

    let payload: unknown = null;
    try {
      // CSP reports arrive as application/csp-report or application/reports+json.
      // request.json() parses both since they are JSON bodies.
      payload = await request.json();
    } catch {
      payload = null;
    }

    const violations = normalize(payload);

    for (const v of violations) {
      const fields = {
        blockedURI: v.blockedURI,
        violatedDirective: v.violatedDirective ?? v.effectiveDirective,
        documentURI: v.documentURI,
        sourceFile: v.sourceFile,
        lineNumber: v.lineNumber,
        disposition: v.disposition,
        userAgent,
      };

      // Emit an OTel span so the violation lands in SigNoz alongside our other
      // telemetry, mirroring the project's tracer-based logging convention.
      tracer.startActiveSpan("csp.violation", (span) => {
        try {
          span.setAttribute("csp.blocked_uri", v.blockedURI ?? "");
          span.setAttribute(
            "csp.violated_directive",
            v.violatedDirective ?? v.effectiveDirective ?? "",
          );
          span.setAttribute("csp.document_uri", v.documentURI ?? "");
          if (v.sourceFile) span.setAttribute("csp.source_file", v.sourceFile);
          if (typeof v.lineNumber === "number")
            span.setAttribute("csp.line_number", v.lineNumber);
          span.setAttribute("csp.disposition", v.disposition ?? "");
          if (userAgent) span.setAttribute("user_agent.original", userAgent.slice(0, 256));
          span.setStatus({ code: SpanStatusCode.OK });
        } finally {
          span.end();
        }
      });

      // Structured stdout log — picked up by SigNoz log collection and serves as
      // the guaranteed fallback when the OTel SDK is not running (e.g. no endpoint).
      console.warn("[csp-violation]", JSON.stringify(fields));
    }
  } catch {
    // Never throw — a reporting endpoint must not surface errors to the browser.
  }

  // 204 No Content: the spec expects no response body for CSP reports.
  return new NextResponse(null, { status: 204 });
}
