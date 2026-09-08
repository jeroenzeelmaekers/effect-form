import { Effect, Layer } from "effect";
import { FetchHttpClient } from "effect/unstable/http";
import {
  OtlpLogger,
  OtlpSerialization,
  OtlpTracer,
} from "effect/unstable/observability";

import { AppConfig } from "@/infrastructure/config";

const TelemetryLayer = Effect.gen(function* () {
  const appConfig = yield* AppConfig;

  const resource = {
    serviceName: "effect-form",
    serviceVersion: appConfig.appVersion,
  };

  const tracerLive = OtlpTracer.layer({
    url: `${appConfig.otlpBaseUrl}/v1/traces`,
    resource,
  });

  const loggerLive = OtlpLogger.layer({
    url: `${appConfig.otlpBaseUrl}/v1/logs`,
    resource,
  });

  return Layer.mergeAll(tracerLive, loggerLive).pipe(
    Layer.provide(FetchHttpClient.layer),
    Layer.provide(OtlpSerialization.layerJson),
  );
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
export const TelemetryLive = Layer.unwrap(TelemetryLayer).pipe(
  Layer.provide(AppConfig.layer),
);
