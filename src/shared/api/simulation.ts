import { Effect } from "effect";
import {
  HttpClient,
  HttpClientError,
  HttpClientRequest,
  HttpClientResponse,
} from "effect/unstable/http";

const mockProblemDetails = {
  notFound: {
    type: "https://api.example.com/problems/not-found",
    title: "Resource Not Found",
    status: 404,
    detail: "The requested users collection could not be found.",
    instance: "/users",
  },
  validation: {
    type: "https://api.example.com/problems/validation-error",
    title: "Validation Failed",
    status: 422,
    detail: "The request payload contains invalid data.",
    instance: "/users",
  },
  serverError: {
    type: "https://api.example.com/problems/internal-error",
    title: "Internal Server Error",
    status: 500,
    detail: "An unexpected error occurred while processing your request.",
    instance: "/users",
  },
};

// Create a mock HTTP response with the given status and body
const createMockResponse = (
  request: HttpClientRequest.HttpClientRequest,
  status: number,
  body: unknown,
) =>
  HttpClientResponse.fromWeb(
    request,
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/problem+json" },
    }),
  );

/**
 * Simulates randomised HTTP failures for a single request, then adds a 3-second
 * artificial delay to mimic realistic network latency.
 *
 * Probability breakdown:
 * - **20 %** — transport-level `TransportError` (connection timeout).
 * - **15 %** — `404 Not Found` response with a Problem Detail body.
 * - **10 %** — `422 Validation Error` response with a Problem Detail body.
 * - **55 %** — delegates to the real `execute` function (happy path).
 *
 * @param request - The outgoing HTTP request to simulate.
 * @param execute - The real execute function to call on the happy path.
 * @returns An `Effect` that resolves to an `HttpClientResponse` or fails with
 *   an `HttpClientError`, always after a 3-second delay.
 */
export const simulateRequest = (
  request: HttpClientRequest.HttpClientRequest,
  execute: (
    req: HttpClientRequest.HttpClientRequest,
  ) => Effect.Effect<
    HttpClientResponse.HttpClientResponse,
    HttpClientError.HttpClientError
  >,
): Effect.Effect<
  HttpClientResponse.HttpClientResponse,
  HttpClientError.HttpClientError
> =>
  Effect.gen(function* () {
    const random = Math.random();

    // 20% chance of request error (connection level)
    if (random < 0.2) {
      return yield* Effect.fail(
        new HttpClientError.HttpClientError({
          reason: new HttpClientError.TransportError({
            request,
            description: "Connection timed out - server unreachable",
          }),
        }),
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
  }).pipe(Effect.delay("3 seconds"));

/**
 * Wraps an `HttpClient` with simulation behavior by delegating every request
 * through `simulateRequest`.
 *
 * The returned client also applies `HttpClient.filterStatusOk` so non-2xx
 * simulated responses are surfaced as `StatusCodeError` instances, consistent
 * with how the production client handles bad status codes.
 *
 * @param client - The real `HttpClient` to wrap.
 * @returns A new `HttpClient` that randomly injects errors and latency.
 */
export const withSimulation = (
  client: HttpClient.HttpClient,
): HttpClient.HttpClient =>
  HttpClient.make((request, _url, _signal, _fiber) =>
    simulateRequest(request, client.execute),
  ).pipe(HttpClient.filterStatusOk);
