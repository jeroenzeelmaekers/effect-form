import { Layer } from "effect";
import { FetchHttpClient } from "effect/unstable/http";
import * as OtlpLogger from "effect/unstable/observability/OtlpLogger";
import * as OtlpSerialization from "effect/unstable/observability/OtlpSerialization";
import * as OtlpTracer from "effect/unstable/observability/OtlpTracer";

const baseUrl = import.meta.env.VITE_OTLP_BASE_URL ?? "/otlp";
const resource = {
  serviceName: "effect-form",
  serviceVersion: import.meta.env.VITE_APP_VERSION ?? "0.0.0",
};

const TracerLive = OtlpTracer.layer({
  url: `${baseUrl}/v1/traces`,
  resource,
});

const LoggerLive = OtlpLogger.layer({
  url: `${baseUrl}/v1/logs`,
  resource,
});

/**
 * Live `Layer` that enables OpenTelemetry tracing and structured logging via
 * the OTLP HTTP exporter.
 *
 * Traces are sent to `VITE_OTLP_BASE_URL/v1/traces` and logs to
 * `VITE_OTLP_BASE_URL/v1/logs` (defaults to `/otlp` when the env variable is
 * not set). Payloads are serialised as JSON using `OtlpSerialization.layerJson`
 * and transported over `fetch` via `FetchHttpClient`.
 *
 * The service name is `"effect-form"` and the version is read from
 * `VITE_APP_VERSION` (falls back to `"0.0.0"`).
 *
 * This layer is conditionally included in the runtime by `infrastructure/runtime.ts`
 * when the `otelEnabled` debug flag is active.
 */
export const TelemetryLive = Layer.mergeAll(TracerLive, LoggerLive).pipe(
  Layer.provide(FetchHttpClient.layer),
  Layer.provide(OtlpSerialization.layerJson),
);
