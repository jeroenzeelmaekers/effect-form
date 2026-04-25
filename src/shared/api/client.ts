import { Context, Effect, Layer, Schedule } from "effect";
import {
  FetchHttpClient,
  HttpClient,
  HttpClientRequest,
} from "effect/unstable/http";

import { DebugService } from "@/domains/debug/service";

import { withSimulation } from "./simulation";

const make = Effect.gen(function* () {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const httpClient = yield* HttpClient.HttpClient;
  const debugService = yield* Effect.service(DebugService);

  const resilientClient = httpClient.pipe(
    HttpClient.retryTransient({
      times: 3,
      schedule: Schedule.exponential("100 millis"),
    }),
    HttpClient.mapRequest(HttpClientRequest.prependUrl(baseUrl)),
  );

  return {
    execute: (request: HttpClientRequest.HttpClientRequest) =>
      Effect.gen(function* () {
        const settings = yield* debugService.get;
        const client = settings.simulationEnabled
          ? withSimulation(resilientClient)
          : resilientClient;
        return yield* client.execute(request);
      }),
  };
});

/**
 * Effect service providing a resilient HTTP client pre-configured for the
 * JSONPlaceholder API base URL (read from `VITE_API_BASE_URL`).
 *
 * The underlying client retries transient failures up to 3 times with
 * exponential back-off starting at 100 ms. When the `simulationEnabled` debug
 * flag is active, requests are routed through `withSimulation` which injects
 * random errors and artificial latency.
 *
 * Depends on: `HttpClient.HttpClient`, `DebugService`.
 *
 * @example
 * const response = yield* ApiClient.pipe(
 *   Effect.flatMap(client => client.execute(HttpClientRequest.get("/users")))
 * );
 */
export class ApiClient extends Context.Service<ApiClient>()("ApiClient", {
  make,
}) {
  /** Live `Layer` that constructs `ApiClient`. */
  static layer = Layer.effect(this)(this.make);
}

/**
 * Fully-wired live `Layer` for `ApiClient`.
 *
 * Provides `ApiClient` together with its transitive dependencies
 * (`FetchHttpClient` and `DebugService`) so consumers only need to provide
 * this single layer to the runtime.
 */
export const ApiLive = ApiClient.layer.pipe(
  Layer.provide(FetchHttpClient.layer),
  Layer.provide(DebugService.layer),
);
