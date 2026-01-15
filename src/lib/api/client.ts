import {
  FetchHttpClient,
  HttpClient,
  HttpClientError,
  HttpClientRequest,
  HttpClientResponse,
} from '@effect/platform';
import { Context, Effect, Layer, Schedule } from 'effect';
import { SimulatedHttpClientLive } from './simulation';

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

    const resilientClient = httpClient.pipe(
      HttpClient.retryTransient({
        times: 3,
        schedule: Schedule.exponential('100 millis'),
      }),
      HttpClient.mapRequest(HttpClientRequest.prependUrl(baseUrl)),
    );

    return {
      execute: (request: HttpClientRequest.HttpClientRequest) =>
        resilientClient.execute(request),
    };
  }),
);

const isSimulationEnabled = import.meta.env.VITE_ENABLE_SIMULATION === 'true';

const HttpClientLive = isSimulationEnabled
  ? SimulatedHttpClientLive.pipe(Layer.provide(FetchHttpClient.layer))
  : FetchHttpClient.layer;

export const ApiLive = ApiClientLive.pipe(Layer.provide(HttpClientLive));
