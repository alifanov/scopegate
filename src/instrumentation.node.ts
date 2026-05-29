import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";

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
    instrumentations: [
      getNodeAutoInstrumentations({
        "@opentelemetry/instrumentation-fs": { enabled: false },
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
}
