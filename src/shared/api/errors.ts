import { Effect, Schema } from "effect";
import { HttpClientResponse } from "effect/unstable/http";
import type { ResponseError } from "effect/unstable/http/HttpClientError";

export const ProblemDetail = Schema.Struct({
  type: Schema.optional(Schema.String),
  title: Schema.optional(Schema.String),
  status: Schema.optional(Schema.Number),
  detail: Schema.optional(Schema.String),
  instance: Schema.optional(Schema.String),
});

export type ProblemDetail = typeof ProblemDetail.Type;

export class NetworkError extends Schema.TaggedErrorClass<NetworkError>()(
  "NetworkError",
  {
    traceId: Schema.optional(Schema.String),
    cause: Schema.optional(Schema.Defect),
  },
) {}

export class NotFoundError extends Schema.TaggedErrorClass<NotFoundError>()(
  "NotFoundError",
  {
    traceId: Schema.optional(Schema.String),
    problemDetail: Schema.optional(ProblemDetail),
  },
) {}

export class ValidationError extends Schema.TaggedErrorClass<ValidationError>()(
  "ValidationError",
  {
    traceId: Schema.optional(Schema.String),
    problemDetail: Schema.optional(ProblemDetail),
  },
) {}

export const getCurrentTraceId = Effect.gen(function* () {
  const span = yield* Effect.currentSpan.pipe(Effect.option);
  return span._tag === "Some" ? span.value.traceId : undefined;
});

export const annotateSpanWithProblemDetail = (
  problemDetail: ProblemDetail,
  statusCode?: number,
) =>
  Effect.annotateCurrentSpan({
    "error.type": problemDetail.type ?? "unknown",
    "error.title": problemDetail.title ?? "unknown",
    "error.status": problemDetail.status ?? statusCode ?? 0,
    "error.detail": problemDetail.detail ?? "unknown",
    "error.instance": problemDetail.instance ?? "unknown",
  });

export function getResponseError(error: ResponseError, traceId?: string) {
  return Effect.gen(function* () {
    traceId = traceId ?? (yield* getCurrentTraceId);

    // extract problem detail from server error
    const problemDetail = yield* HttpClientResponse.schemaBodyJson(
      ProblemDetail,
    )(error.response).pipe(
      Effect.catch(() => Effect.succeed({} as ProblemDetail)),
    );

    // annotate span with problem detail
    if (Object.keys(problemDetail).length > 0) {
      yield* annotateSpanWithProblemDetail(
        problemDetail,
        error.response.status,
      );
    }

    // map to specific error types based on status code,
    // could also map on problem detail type
    switch (error.response.status) {
      case 404:
        return yield* Effect.fail(
          new NotFoundError({ traceId, problemDetail }),
        );
      case 422:
        return yield* Effect.fail(
          new ValidationError({ traceId, problemDetail }),
        );
      default:
        return yield* Effect.fail(new NetworkError({ traceId }));
    }
  });
}
