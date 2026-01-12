import { Post } from '@/models/post';
import { HttpClientRequest, HttpClientResponse } from '@effect/platform';
import { Effect, flow, Schema } from 'effect';
import { ApiClient } from './client';
import { getResponseError, NetworkError, ValidationError } from './errors';

export class PostService extends Effect.Service<PostService>()('PostService', {
  accessors: true,
  scoped: Effect.gen(function* () {
    const client = yield* ApiClient;

    const getPosts = Effect.fn('Get Posts')(
      function* () {
        const request = HttpClientRequest.get('/posts');
        const response = yield* client.execute(request);
        return yield* HttpClientResponse.schemaBodyJson(Schema.Array(Post))(
          response
        );
      },
      flow(
        Effect.catchTags({
          RequestError: (e) =>
            Effect.fail(new NetworkError({ message: e.message })),
          ResponseError: (error) => getResponseError(error),
          ParseError: (e) =>
            Effect.fail(new ValidationError({ message: e.message })),
        })
      )
    );
    return { getPosts } as const;
  }),
}) {}
