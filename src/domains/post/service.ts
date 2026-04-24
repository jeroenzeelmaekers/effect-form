import { Effect, Layer, Schema, ServiceMap } from "effect";
import { HttpClientRequest, HttpClientResponse } from "effect/unstable/http";

import { Post } from "@/domains/post/model";
import { ApiClient } from "@/shared/api/client";
import {
  catchHttpClientError,
  getCurrentTraceId,
  NetworkError,
  ValidationError,
} from "@/shared/api/errors";

const make = Effect.gen(function* () {
  const client = yield* ApiClient;

  const getPosts = Effect.fn("Get Posts")(function* () {
    const traceId = yield* getCurrentTraceId;
    const request = HttpClientRequest.get("/posts");
    const response = yield* client.execute(request).pipe(
      Effect.timeout("10 seconds"),
      Effect.catchTag("HttpClientError", catchHttpClientError(traceId)),
      Effect.catchTag("TimeoutError", () =>
        Effect.fail(new NetworkError({ traceId })),
      ),
    );
    return yield* HttpClientResponse.schemaBodyJson(Schema.Array(Post))(
      response,
    ).pipe(
      Effect.catchTag("SchemaError", () =>
        Effect.fail(
          new ValidationError({
            traceId,
          }),
        ),
      ),
    );
  });

  return { getPosts } as const;
});

/**
 * Effect service that provides post-related API operations.
 *
 * Depends on `ApiClient` for HTTP execution. Operations are traced via
 * OpenTelemetry spans and map HTTP/schema failures to typed domain errors.
 *
 * Available methods (injected via `make`):
 * - `getPosts` — fetches all posts from `GET /posts`, returns a `Post[]`.
 *   Fails with `NetworkError | ValidationError`. Times out after 10 seconds.
 *
 * @example
 * const posts = yield* PostService.pipe(
 *   Effect.flatMap(svc => svc.getPosts())
 * );
 */
export class PostService extends ServiceMap.Service<PostService>()(
  "PostService",
  {
    make,
  },
) {
  /** Live `Layer` that constructs `PostService` using `ApiClient`. */
  static layer = Layer.effect(this, this.make);
}
