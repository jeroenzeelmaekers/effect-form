import { Effect, Schema } from "effect";
import { HttpClientError, HttpClientResponse } from "effect/unstable/http";
import type { ResponseError } from "effect/unstable/http/HttpClientError";

/**
 * Effect Schema struct representing an RFC 7807 Problem Detail object.
 *
 * All fields are optional so the struct can safely decode partial or empty
 * server error responses without failing.
 *
 * Fields:
 * - `type` — URI reference that identifies the problem type.
 * - `title` — short human-readable summary of the problem.
 * - `status` — HTTP status code associated with the problem.
 * - `detail` — human-readable explanation specific to this occurrence.
 * - `instance` — URI reference that identifies the specific occurrence.
 */
export const ProblemDetail = Schema.Struct({
  type: Schema.optional(Schema.String),
  title: Schema.optional(Schema.String),
  status: Schema.optional(Schema.Number),
  detail: Schema.optional(Schema.String),
  instance: Schema.optional(Schema.String),
});

/** TypeScript type inferred from the `ProblemDetail` schema. */
export type ProblemDetail = typeof ProblemDetail.Type;

/**
 * Tagged error class representing a network-level failure (connection errors,
 * timeouts, unexpected server errors not mapped to a more specific type).
 *
 * Fields:
 * - `traceId` — optional OpenTelemetry trace ID for correlation.
 * - `cause` — optional underlying defect that triggered the error.
 */
export class NetworkError extends Schema.TaggedErrorClass<NetworkError>()(
  "NetworkError",
  {
    traceId: Schema.optional(Schema.String),
    cause: Schema.optional(Schema.Defect),
  },
) {}

/**
 * Tagged error class representing an HTTP 404 Not Found response.
 *
 * Fields:
 * - `traceId` — optional OpenTelemetry trace ID for correlation.
 * - `problemDetail` — optional RFC 7807 problem detail decoded from the response body.
 */
export class NotFoundError extends Schema.TaggedErrorClass<NotFoundError>()(
  "NotFoundError",
  {
    traceId: Schema.optional(Schema.String),
    problemDetail: Schema.optional(ProblemDetail),
  },
) {}

/**
 * Tagged error class representing an HTTP 422 Unprocessable Entity response
 * or a local schema decode failure.
 *
 * Fields:
 * - `traceId` — optional OpenTelemetry trace ID for correlation.
 * - `problemDetail` — optional RFC 7807 problem detail decoded from the response body.
 */
export class ValidationError extends Schema.TaggedErrorClass<ValidationError>()(
  "ValidationError",
  {
    traceId: Schema.optional(Schema.String),
    problemDetail: Schema.optional(ProblemDetail),
  },
) {}

/**
 * Effect that resolves to the trace ID of the current OpenTelemetry span, if any.
 *
 * Returns `undefined` when there is no active span (e.g. when OTel is disabled).
 *
 * @returns `string | undefined` — the current trace ID or `undefined`.
 */
export const getCurrentTraceId = Effect.gen(function* () {
  const span = yield* Effect.currentSpan.pipe(Effect.option);
  return span._tag === "Some" ? span.value.traceId : undefined;
});

/**
 * Annotates the current OpenTelemetry span with attributes derived from a
 * `ProblemDetail` object.
 *
 * Attributes set: `error.type`, `error.title`, `error.status`, `error.detail`,
 * `error.instance`. Falls back to `"unknown"` or `0` for missing fields.
 *
 * @param problemDetail - The RFC 7807 problem detail to extract attributes from.
 * @param statusCode - Optional HTTP status code used as fallback for `error.status`.
 * @returns An `Effect` that annotates the current span and resolves to `void`.
 */
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

/**
 * Maps a `ResponseError` (from `effect/unstable/http`) to a typed domain error
 * by inspecting the HTTP status code.
 *
 * Also attempts to decode an RFC 7807 Problem Detail from the response body
 * and annotates the current span when one is found.
 *
 * Status code mapping:
 * - `404` → `NotFoundError`
 * - `422` → `ValidationError`
 * - anything else → `NetworkError`
 *
 * @param error - The `ResponseError` to handle.
 * @param traceId - Optional trace ID; falls back to `getCurrentTraceId` when omitted.
 * @returns An `Effect` that always fails with a typed domain error.
 */
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

/**
 * Catches `HttpClientError` and maps it to a typed domain error.
 * Use this with `Effect.catchTag("HttpClientError", catchHttpClientError(traceId))`.
 *
 * Handles the following `HttpClientError` reasons:
 * - `StatusCodeError` / `DecodeError` / `EmptyBodyError` — delegated to `getResponseError`.
 * - All other reasons (e.g. transport failures) — mapped to `NetworkError`.
 *
 * @param traceId - Optional trace ID to attach to the resulting error.
 * @returns A curried function that accepts an `HttpClientError` and returns an
 *   `Effect` that fails with `NetworkError | NotFoundError | ValidationError`.
 */
export const catchHttpClientError =
  (traceId?: string) =>
  (
    error: HttpClientError.HttpClientError,
  ): Effect.Effect<never, NetworkError | NotFoundError | ValidationError> => {
    const reason = error.reason;
    switch (reason._tag) {
      case "StatusCodeError":
      case "DecodeError":
      case "EmptyBodyError":
        return getResponseError(reason, traceId);
      default:
        return Effect.fail(new NetworkError({ traceId }));
    }
  };
