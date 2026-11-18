import { describe, expect, it } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { HttpClient, HttpClientRequest, HttpClientResponse } from "effect/http";

import { DebugService } from "@/domains/debug/service";
import { AppConfig } from "@/infrastructure/config";

import { ApiClient } from "./client";

const apiBaseUrl = "https://api.example.com";

describe("ApiClient", () => {
  it.effect("prepends the configured base URL to outgoing requests", () => {
    let outgoingRequest: HttpClientRequest.HttpClientRequest | undefined;
    const request = HttpClientRequest.get(`${apiBaseUrl}/users`);
    const httpClient = HttpClient.make((outgoing) => {
      outgoingRequest = outgoing;
      return Effect.succeed(
        HttpClientResponse.fromWeb(
          request,
          new Response(null, { status: 200 }),
        ),
      );
    });
    const appConfigLayer = Layer.succeed(AppConfig)({
      apiBaseUrl,
      otlpBaseUrl: "/otlp",
      appVersion: "test",
    });
    const debugServiceLayer = Layer.succeed(DebugService)({
      get: Effect.succeed({ simulationEnabled: false, otelEnabled: false }),
      setSimulationEnabled: () => Effect.void,
      setOtelEnabled: () => Effect.void,
    });
    const httpClientLayer = Layer.succeed(HttpClient.HttpClient)(httpClient);
    const dependencies = Layer.mergeAll(
      appConfigLayer,
      debugServiceLayer,
      httpClientLayer,
    );

    return Effect.gen(function* () {
      const client = yield* ApiClient;
      yield* client.execute(HttpClientRequest.get("/users"));

      expect(outgoingRequest?.url).toBe(`${apiBaseUrl}/users`);
    }).pipe(Effect.provide(ApiClient.layer.pipe(Layer.provide(dependencies))));
  });
});
