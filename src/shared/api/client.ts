import {
  FetchHttpClient,
  HttpClient,
  HttpClientRequest,
} from "effect/unstable/http";
import { Effect, Layer, Schedule, ServiceMap } from "effect";

import { DebugService } from "@/domains/debug/service";

import { withSimulation } from "./simulation";

const make = Effect.gen(function* () {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const httpClient = yield* HttpClient.HttpClient;
  const debugService = yield* DebugService;

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

export class ApiClient extends ServiceMap.Service<ApiClient>()("ApiClient", {
  make,
}) {
  static layer = Layer.effect(this, this.make);
}

export const ApiLive = ApiClient.layer.pipe(
  Layer.provide(FetchHttpClient.layer),
  Layer.provide(DebugService.layer),
);
