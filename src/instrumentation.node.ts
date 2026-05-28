import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";

const obsUrl = process.env.OBSERVABILITY_URL ?? "https://signoz.chatindex.app";
const apiKey = process.env.OBSERVABILITY_API_KEY ?? "";

if (!apiKey) {
  console.warn("[OTel] OBSERVABILITY_API_KEY is not set — traces will not be ingested by SigNoz");
}
console.log(`[OTel] Starting SDK, exporting to ${obsUrl}/v1/traces`);

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: "scopegate",
  }),
  traceExporter: new OTLPTraceExporter({
    url: `${obsUrl}/v1/traces`,
    headers: {
      "signoz-ingestion-key": apiKey,
    },
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      "@opentelemetry/instrumentation-fs": { enabled: false },
    }),
  ],
});

sdk.start();
