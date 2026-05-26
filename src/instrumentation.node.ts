import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: "scopegate",
  }),
  traceExporter: new OTLPTraceExporter({
    url: `${process.env.OBSERVABILITY_URL ?? "https://signoz.chatindex.app"}/v1/traces`,
    headers: {
      "signoz-ingestion-key": process.env.OBSERVABILITY_API_KEY ?? "",
    },
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      "@opentelemetry/instrumentation-fs": { enabled: false },
    }),
  ],
});

sdk.start();
