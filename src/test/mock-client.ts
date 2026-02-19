import { Effect, Layer } from "effect";
import { HttpClientRequest, HttpClientResponse } from "effect/unstable/http";

import { ApiClient } from "@/shared/api/client";

export const createMockApiClient = (
  handler: (
    request: HttpClientRequest.HttpClientRequest,
  ) => Effect.Effect<HttpClientResponse.HttpClientResponse>,
): Layer.Layer<ApiClient> =>
  Layer.succeed(ApiClient)({
    execute: handler,
  });

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
