import { HttpClientResponse } from '@effect/platform';
import type { ResponseError } from '@effect/platform/HttpClientError';
import { Effect, Schema } from 'effect';

export type Resource = 'user' | 'post' | 'language';

export const Resource = Schema.Literal('user', 'post', 'language');

export const ProblemDetail = Schema.Struct({
  type: Schema.optional(Schema.String),
  title: Schema.optional(Schema.String),
  status: Schema.optional(Schema.Number),
  detail: Schema.optional(Schema.String),
  instance: Schema.optional(Schema.String),
});

export type ProblemDetail = typeof ProblemDetail.Type;

export class NetworkError extends Schema.TaggedError<NetworkError>()(
  'NetworkError',
  {
    traceId: Schema.optional(Schema.String),
    cause: Schema.optional(Schema.Defect),
  },
) {}

export class NotFoundError extends Schema.TaggedError<NotFoundError>()(
  'NotFoundError',
  {
    traceId: Schema.optional(Schema.String),
    problemDetail: Schema.optional(ProblemDetail),
    resource: Schema.optional(Resource),
  },
) {}

export class ValidationError extends Schema.TaggedError<ValidationError>()(
  'ValidationError',
  {
    traceId: Schema.optional(Schema.String),
    problemDetail: Schema.optional(ProblemDetail),
  },
) {}

export const getCurrentTraceId = Effect.gen(function* () {
  const span = yield* Effect.currentSpan.pipe(Effect.option);
  return span._tag === 'Some' ? span.value.traceId : undefined;
});

export const annotateSpanWithProblemDetail = (
  problemDetail: ProblemDetail,
  statusCode?: number,
) =>
  Effect.annotateCurrentSpan({
    'error.type': problemDetail.type ?? 'unknown',
    'error.title': problemDetail.title ?? 'unknown',
    'error.status': problemDetail.status ?? statusCode ?? 0,
    'error.detail': problemDetail.detail ?? 'unknown',
    'error.instance': problemDetail.instance ?? 'unknown',
  });

export function getResponseError(
  error: ResponseError,
  traceId?: string,
  resource?: Resource,
) {
  return Effect.gen(function* () {
    const resolvedTraceId = traceId ?? (yield* getCurrentTraceId);

    const problemDetail = yield* HttpClientResponse.schemaBodyJson(
      ProblemDetail,
    )(error.response).pipe(
      Effect.catchAll(() => Effect.succeed({} as ProblemDetail)),
    );

    if (Object.keys(problemDetail).length > 0) {
      yield* annotateSpanWithProblemDetail(problemDetail, error.response.status);
    }

    if (error.response.status === 404) {
      return yield* Effect.fail(
        new NotFoundError({ traceId: resolvedTraceId, problemDetail, resource }),
      );
    }

    if (
      error.response.status === 422 ||
      problemDetail.type?.includes('validation')
    ) {
      return yield* Effect.fail(
        new ValidationError({ traceId: resolvedTraceId, problemDetail }),
      );
    }

    return yield* Effect.fail(new NetworkError({ traceId: resolvedTraceId }));
  });
}
