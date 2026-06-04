import * as fs from "fs";
import * as path from "path";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { metrics, type Counter } from "@opentelemetry/api";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import { PrismaInstrumentation } from "@prisma/instrumentation";

// Mirrors the regex in middleware.ts — valid Server Action IDs are 40-char hex SHA-1 hashes.
const VALID_ACTION_ID = /^[0-9a-f]{40}$/;

// Populated after sdk.start() so the requestHook can increment it.
let blockedRequestsCounter: Counter | null = null;

// OAuth token endpoints — 4xx failures (e.g. invalid_grant) are expected,
// handled at the application level, and tracked in ServiceConnection.status.
// Skipping instrumentation avoids false-positive ERROR spans in SigNoz.
const OAUTH_TOKEN_URL_PATTERNS = [
  "oauth2.googleapis.com/token",
  "linkedin.com/oauth/v2/accessToken",
  "salesforce.com/services/oauth2/token",
  "atlassian.com/oauth/token",
  "hubapi.com/oauth/v1/token",
  "slack.com/api/oauth",
  "github.com/login/oauth/access_token",
  "twitter.com/oauth2/token",
  "api.twitter.com/2/oauth2",
  "graph.threads.net/oauth/access_token",
  "graph.threads.net/refresh_access_token",
];

// Build route pattern matchers from Next.js App Router file structure at startup.
// Maps actual URL paths (e.g. /api/mcp/abc123) → route patterns (e.g. /api/mcp/[apiKey]).
// Falls back gracefully if source files are absent (e.g. production containers).
function buildRouteMatchers(appDir: string): Array<[RegExp, string]> {
  const patterns: Array<[RegExp, string]> = [];

  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name === "route.ts" || entry.name === "route.js") {
        const routePattern = fullPath
          .replace(appDir, "")
          .replace(/\/route\.(ts|js)$/, "")
          .replace(/\\/g, "/");

        const regexStr = routePattern
          .replace(/\[\.\.\.[^\]]+\]/g, "(?:.+)") // [...catchAll] segments
          .replace(/\[[^\]]+\]/g, "(?:[^/]+)"); // [param] segments

        patterns.push([new RegExp(`^${regexStr}(?:\\?.*)?$`), routePattern]);
      }
    }
  }

  try {
    walk(appDir);
    // Sort descending by segment depth so more-specific routes match first
    patterns.sort((a, b) => b[1].split("/").length - a[1].split("/").length);
  } catch {
    // src/app not present — pattern normalization disabled, raw paths used
  }

  return patterns;
}

const routeMatchers = buildRouteMatchers(path.join(process.cwd(), "src", "app"));

function normalizeRoute(rawUrl: string): string {
  const urlPath = rawUrl.split("?")[0];
  for (const [regex, pattern] of routeMatchers) {
    if (regex.test(urlPath)) return pattern;
  }
  return urlPath;
}

const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

if (!endpoint) {
  console.warn("[OTel] OTEL_EXPORTER_OTLP_ENDPOINT is not set — tracing disabled");
} else {
  console.log(`[OTel] Starting SDK, exporting to ${endpoint}/v1/traces`);

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME ?? "scopegate",
    }),
    traceExporter: new OTLPTraceExporter({
      url: `${endpoint}/v1/traces`,
    }),
    metricReaders: [
      new PeriodicExportingMetricReader({
        exporter: new OTLPMetricExporter({
          url: `${endpoint}/v1/metrics`,
        }),
        exportIntervalMillis: 60_000,
      }),
    ],
    instrumentations: [
      new PrismaInstrumentation(),
      getNodeAutoInstrumentations({
        "@opentelemetry/instrumentation-fs": { enabled: false },
        "@opentelemetry/instrumentation-http": {
          requestHook: (span, request) => {
            // IncomingMessage (server requests) has `url`; ClientRequest does not.
            // Set http.route on incoming server spans so SigNoz can filter by route.
            const req = request as {
              url?: string;
              headers?: Record<string, string | string[] | undefined>;
            };
            if (typeof req.url !== "string" || !req.url) return;

            // Capture client identity on every incoming span so any 400 in SigNoz
            // can be traced back to its source (IP, User-Agent) for diagnostics.
            const rawIp = req.headers?.["x-forwarded-for"];
            const ip = Array.isArray(rawIp) ? rawIp[0] : rawIp;
            const rawUa = req.headers?.["user-agent"];
            const ua = Array.isArray(rawUa) ? rawUa[0] : rawUa;
            if (ip) span.setAttribute("client.address", ip);
            if (ua) span.setAttribute("user_agent.original", ua.slice(0, 256));

            const actionId = req.headers?.["next-action"];
            if (typeof actionId === "string" && !VALID_ACTION_ID.test(actionId)) {
              // Middleware will 400 this — group under a canonical route so SigNoz
              // shows these bot-scan blocks as a single aggregated route, not noise.
              span.setAttribute("http.route", "/[blocked-action]");
              span.setAttribute("block.reason", "invalid-next-action");
              blockedRequestsCounter?.add(1);
            } else {
              span.setAttribute("http.route", normalizeRoute(req.url));
            }
          },
        },
        "@opentelemetry/instrumentation-undici": {
          ignoreRequestHook: (request) => {
            const fullUrl = `${request.origin}${request.path}`;
            return OAUTH_TOKEN_URL_PATTERNS.some((pattern) =>
              fullUrl.includes(pattern)
            );
          },
        },
      }),
    ],
  });

  sdk.start();

  blockedRequestsCounter = metrics.getMeter("scopegate").createCounter(
    "mcp.blocked_requests",
    { description: "Requests blocked by middleware due to invalid Next-Action header" },
  );
}
