import { Post } from '@/models/post';
import { HttpClientRequest, HttpClientResponse } from '@effect/platform';
import { Effect, Schema } from 'effect';
import { ApiClient } from './client';
import {
  getCurrentTraceId,
  getResponseError,
  NetworkError,
  ValidationError,
} from './errors';

export class PostService extends Effect.Service<PostService>()('PostService', {
  accessors: true,
  scoped: Effect.gen(function* () {
    const client = yield* ApiClient;

    const getPosts = Effect.fn('Get Posts')(function* () {
      const traceId = yield* getCurrentTraceId;
      const request = HttpClientRequest.get('/posts');
      const response = yield* client.execute(request).pipe(
        Effect.catchTags({
          RequestError: () =>
            Effect.fail(
              new NetworkError({
                traceId,
              }),
            ),
          ResponseError: (error) => getResponseError(error, traceId),
        }),
      );
      return yield* HttpClientResponse.schemaBodyJson(Schema.Array(Post))(
        response,
      ).pipe(
        Effect.catchTag('ParseError', () =>
          Effect.fail(
            new ValidationError({
              traceId,
            }),
          ),
        ),
      );
    });

    return { getPosts } as const;
  }),
}) {}
