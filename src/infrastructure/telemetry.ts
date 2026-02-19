import * as OtlpLogger from "effect/unstable/observability/OtlpLogger";
import * as OtlpSerialization from "effect/unstable/observability/OtlpSerialization";
import * as OtlpTracer from "effect/unstable/observability/OtlpTracer";
import { FetchHttpClient } from "effect/unstable/http";
import { Layer } from "effect";

const baseUrl = import.meta.env.VITE_OTLP_BASE_URL ?? "http://localhost:4318";
const resource = {
  serviceName: "effect-form",
  serviceVersion: "0.0.0",
};

const TracerLive = OtlpTracer.layer({
  url: `${baseUrl}/v1/traces`,
  resource,
});

const LoggerLive = OtlpLogger.layer({
  url: `${baseUrl}/v1/logs`,
  resource,
});

export const TelemetryLive = Layer.mergeAll(TracerLive, LoggerLive).pipe(
  Layer.provide(FetchHttpClient.layer),
  Layer.provide(OtlpSerialization.layerJson),
);
