import { HttpClientResponse } from '@effect/platform';
import type { ResponseError } from '@effect/platform/HttpClientError';
import { Data, Effect, Schema } from 'effect';

export class NetworkError extends Data.TaggedError('NetworkError')<{
  readonly message: string;
}> {}

export class UsersNotFound extends Data.TaggedError('UserNotFound')<{
  readonly message: string;
}> {}

export class ValidationError extends Data.TaggedError('ValidationError')<{
  readonly message: string;
}> {}

export const ProblemDetail = Schema.Struct({
  type: Schema.optional(Schema.String),
  title: Schema.optional(Schema.String),
  status: Schema.optional(Schema.Number),
  detail: Schema.optional(Schema.String),
  instance: Schema.optional(Schema.String),
});

// Response errors are handled based on status codes and problem details
export function getResponseError(error: ResponseError) {
  return Effect.gen(function* () {
    const problemDetail = yield* HttpClientResponse.schemaBodyJson(
      ProblemDetail
    )(error.response);

    const message =
      problemDetail.detail ?? problemDetail.title ?? error.message;

    if (error.response.status === 404) {
      return yield* Effect.fail(new UsersNotFound({ message }));
    }

    if (
      error.response.status === 422 ||
      problemDetail.type?.includes('validation')
    ) {
      return yield* Effect.fail(new ValidationError({ message }));
    }

    return yield* Effect.fail(new NetworkError({ message }));
  });
}
