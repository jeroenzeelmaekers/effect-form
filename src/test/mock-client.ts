import { Effect, Layer } from "effect";
import { HttpClientRequest, HttpClientResponse } from "effect/unstable/http";

import { ApiClient } from "@/shared/api/client";

/**
 * Creates a test `Layer` that provides a mock `ApiClient`.
 *
 * The supplied `handler` function is called for every `execute` invocation,
 * allowing tests to return arbitrary `HttpClientResponse` values (or fail with
 * typed errors) without making real network requests.
 *
 * @param handler - A function that receives the outgoing `HttpClientRequest`
 *   and returns an `Effect` resolving to a mock `HttpClientResponse`.
 * @returns A `Layer<ApiClient>` suitable for use with `Effect.provide` in tests.
 *
 * @example
 * const layer = createMockApiClient((req) =>
 *   Effect.succeed(createMockResponse(200, [{ id: 1, name: "Alice" }]))
 * );
 * const result = await Effect.runPromise(
 *   program.pipe(Effect.provide(layer))
 * );
 */
export const createMockApiClient = (
  handler: (
    request: HttpClientRequest.HttpClientRequest,
  ) => Effect.Effect<HttpClientResponse.HttpClientResponse>,
): Layer.Layer<ApiClient> =>
  Layer.succeed(ApiClient)({
    execute: handler,
  });

/**
 * Builds a minimal `HttpClientResponse` suitable for use in tests.
 *
 * Serialises `body` as JSON and wraps it in a `Response` with the given
 * `status` code and a `Content-Type: application/json` header. The request
 * URL is fixed to `"http://test"`.
 *
 * @param status - The HTTP status code for the mock response (e.g. `200`, `404`).
 * @param body - The response payload; will be `JSON.stringify`-ed.
 * @returns An `HttpClientResponse` that can be returned from a mock handler.
 *
 * @example
 * const response = createMockResponse(200, [{ id: 1, title: "Post" }]);
 * const response404 = createMockResponse(404, { title: "Not Found", status: 404 });
 */
export const createMockResponse = (
  status: number,
  body: unknown,
): HttpClientResponse.HttpClientResponse =>
  HttpClientResponse.fromWeb(
    HttpClientRequest.get("http://test"),
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
