import {
  HttpClient,
  HttpClientError,
  HttpClientRequest,
  HttpClientResponse,
} from '@effect/platform';
import { Effect, Layer } from 'effect';

const mockProblemDetails = {
  notFound: {
    type: 'https://api.example.com/problems/not-found',
    title: 'Resource Not Found',
    status: 404,
    detail: 'The requested users collection could not be found.',
    instance: '/users',
  },
  validation: {
    type: 'https://api.example.com/problems/validation-error',
    title: 'Validation Failed',
    status: 422,
    detail: 'The request payload contains invalid data.',
    instance: '/users',
  },
  serverError: {
    type: 'https://api.example.com/problems/internal-error',
    title: 'Internal Server Error',
    status: 500,
    detail: 'An unexpected error occurred while processing your request.',
    instance: '/users',
  },
};

// Create a mock HTTP response with the given status and body
const createMockResponse = (
  request: HttpClientRequest.HttpClientRequest,
  status: number,
  body: unknown
) =>
  HttpClientResponse.fromWeb(
    request,
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/problem+json' },
    })
  );

// Simulate random errors at the HTTP client level
const simulateErrors = (
  request: HttpClientRequest.HttpClientRequest,
  execute: (
    req: HttpClientRequest.HttpClientRequest
  ) => Effect.Effect<
    HttpClientResponse.HttpClientResponse,
    HttpClientError.HttpClientError
  >
) =>
  Effect.gen(function* () {
    const random = Math.random();

    // 20% chance of request error (connection level)
    if (random < 0.2) {
      return yield* Effect.fail(
        new HttpClientError.RequestError({
          request,
          reason: 'Transport',
          description: 'Connection timed out - server unreachable',
        })
      );
    }

    // 15% chance of 404 Not Found
    if (random < 0.35) {
      return createMockResponse(request, 404, mockProblemDetails.notFound);
    }

    // 10% chance of 422 Validation Error
    if (random < 0.45) {
      return createMockResponse(request, 422, mockProblemDetails.validation);
    }

    // 55% chance of success - execute the real request
    return yield* execute(request);
  });

export const SimulatedHttpClientLive = Layer.effect(
  HttpClient.HttpClient,
  Effect.gen(function* () {
    const client = yield* HttpClient.HttpClient;

    return HttpClient.make((request) =>
      simulateErrors(request, client.execute).pipe(Effect.delay('3 seconds'))
    ).pipe(HttpClient.filterStatusOk);
  })
);
