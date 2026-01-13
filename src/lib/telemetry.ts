import * as OtelResource from '@effect/opentelemetry/Resource';
import * as OtelTracer from '@effect/opentelemetry/Tracer';
import * as OtelWebSdk from '@effect/opentelemetry/WebSdk';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-web';
import { Layer } from 'effect';

const ResourceLive = OtelResource.layer({
  serviceName: 'effect-form',
  serviceVersion: '0.0.0',
});

const TracerProviderLive = OtelWebSdk.layerTracerProvider(
  new BatchSpanProcessor(
    new OTLPTraceExporter({
      url: import.meta.env.VITE_OTLP_EXPORTER_URL,
    })
  )
);

export const TracingLive = OtelTracer.layer.pipe(
  Layer.provide(TracerProviderLive),
  Layer.provide(ResourceLive)
);
