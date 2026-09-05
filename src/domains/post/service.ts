import { Context, Effect, Layer, Schema } from "effect";
import { HttpClientRequest, HttpClientResponse } from "effect/unstable/http";

import { Post } from "@/domains/post/model";
import { ApiClient } from "@/shared/api/client";
import {
  catchHttpClientError,
  getCurrentTraceId,
  NetworkError,
  NotFoundError,
  ValidationError,
} from "@/shared/api/errors";

interface PostServiceShape {
  readonly getPosts: () => Effect.Effect<
    ReadonlyArray<typeof Post.Type>,
    NetworkError | NotFoundError | ValidationError
  >;
}

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
 *   Effect.flatMap(service => service.getPosts())
 * );
 */
export class PostService extends Context.Service<
  PostService,
  PostServiceShape
>()("effect-form/domains/post/PostService") {
  /** Live `Layer` that constructs `PostService` using `ApiClient`. */
  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
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
          Effect.catchTag("HttpClientError", catchHttpClientError(traceId)),
          Effect.catchTag("SchemaError", () =>
            Effect.fail(
              new ValidationError({
                traceId,
              }),
            ),
          ),
        );
      });

      return PostService.of({ getPosts });
    }),
  );
}
