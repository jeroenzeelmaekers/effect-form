import {
  FetchHttpClient,
  HttpClient,
  HttpClientError,
  HttpClientRequest,
  HttpClientResponse,
} from '@effect/platform';
import { Context, Effect, Layer } from 'effect';
import { SimulatedHttpClientLive } from './simulation';

export interface ApiClientService {
  readonly execute: (
    request: HttpClientRequest.HttpClientRequest
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

    const client = httpClient.pipe(
      HttpClient.mapRequest(HttpClientRequest.prependUrl(baseUrl))
    );

    return {
      execute: (request: HttpClientRequest.HttpClientRequest) =>
        client.execute(request),
    };
  })
);

const HttpClientLive = SimulatedHttpClientLive.pipe(
  Layer.provide(FetchHttpClient.layer)
);

export const ApiLive = ApiClientLive.pipe(Layer.provide(HttpClientLive));
