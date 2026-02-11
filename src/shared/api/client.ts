import {
  FetchHttpClient,
  HttpClient,
  HttpClientError,
  HttpClientRequest,
  HttpClientResponse,
} from '@effect/platform';
import { Context, Effect, Layer, Schedule } from 'effect';

import { DebugService } from '@/domains/debug/service';

import { withSimulation } from './simulation';

export interface ApiClientService {
  readonly execute: (
    request: HttpClientRequest.HttpClientRequest,
  ) => Effect.Effect<
    HttpClientResponse.HttpClientResponse,
    HttpClientError.HttpClientError
  >;
}

export class ApiClient extends Context.Tag('ApiClient')<
  ApiClient,
  ApiClientService
>() {}

const ApiClientLive = Layer.effect(
  ApiClient,
  Effect.gen(function* () {
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    const httpClient = yield* HttpClient.HttpClient;
    const debugService = yield* DebugService;

    const resilientClient = httpClient.pipe(
      HttpClient.retryTransient({
        times: 3,
        schedule: Schedule.exponential('100 millis'),
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
  }),
);

export const ApiLive = ApiClientLive.pipe(
  Layer.provide(FetchHttpClient.layer),
  Layer.provide(DebugService.Default),
);
