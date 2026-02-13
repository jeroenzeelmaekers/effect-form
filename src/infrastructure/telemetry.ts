import * as OtlpLogger from "@effect/opentelemetry/OtlpLogger";
import * as OtlpSerialization from "@effect/opentelemetry/OtlpSerialization";
import * as OtlpTracer from "@effect/opentelemetry/OtlpTracer";
import { FetchHttpClient } from "@effect/platform";
import { Layer, Logger } from "effect";

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
  replaceLogger: Logger.none,
});

export const TelemetryLive = Layer.mergeAll(TracerLive, LoggerLive).pipe(
  Layer.provide(FetchHttpClient.layer),
  Layer.provide(OtlpSerialization.layerJson),
);
