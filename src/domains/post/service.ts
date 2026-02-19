import { Effect, Layer, Schema, ServiceMap } from "effect";
import { HttpClientRequest, HttpClientResponse } from "effect/unstable/http";

import { Post } from "@/domains/post/model";
import { ApiClient } from "@/shared/api/client";
import {
  getCurrentTraceId,
  getResponseError,
  NetworkError,
  ValidationError,
} from "@/shared/api/errors";

const make = Effect.gen(function* () {
  const client = yield* ApiClient;

  const getPosts = Effect.fn("Get Posts")(function* () {
    const traceId = yield* getCurrentTraceId;
    const request = HttpClientRequest.get("/posts");
    const response = yield* client.execute(request).pipe(
      Effect.catchTag("HttpClientError", (error) => {
        const reason = error.reason;
        switch (reason._tag) {
          case "StatusCodeError":
          case "DecodeError":
          case "EmptyBodyError":
            return getResponseError(reason, traceId);
          default:
            return Effect.fail(new NetworkError({ traceId }));
        }
      }),
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

export class PostService extends ServiceMap.Service<PostService>()(
  "PostService",
  {
    make,
  },
) {
  static layer = Layer.effect(this, this.make);
}
