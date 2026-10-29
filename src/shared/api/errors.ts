import { Effect, Option, Predicate, Schema } from "effect";
import {
  HttpClientError,
  HttpClientResponse,
  ProblemDetails,
} from "effect/http";
import { HttpApiError } from "effect/http-api";
import type { ResponseError } from "effect/http/HttpClientError";

export const ProblemType = {
  notFound: "https://api.example.com/problems/not-found",
  validation: "https://api.example.com/problems/validation-error",
} as const;

/**
 * Tagged error class representing a network-level failure (connection errors,
 * timeouts, unexpected server errors not mapped to a more specific type).
 *
 * Fields:
 * - `traceId` — optional OpenTelemetry trace ID for correlation.
 * - `cause` — optional underlying defect that triggered the error.
 */
export class NetworkError extends Schema.TaggedError<NetworkError>()(
  "NetworkError",
  {
    traceId: Schema.optional(Schema.String),
    cause: Schema.optional(Schema.Defect()),
  },
) {}

/**
 * Tagged error class representing an HTTP 404 Not Found response.
 *
 * Fields:
 * - `traceId` — optional OpenTelemetry trace ID for correlation.
 * - `problemDetail` — optional RFC 9457 problem details decoded from the response body.
 */
export class NotFoundError extends HttpApiError.Problem<NotFoundError>()(
  "NotFoundError",
  {
    type: ProblemType.notFound,
    status: 404,
    title: "Resource Not Found",
  },
  {
    traceId: Schema.optional(Schema.String),
    problemDetail: Schema.optional(ProblemDetails.Schema),
  },
) {}

/**
 * Tagged error class representing an HTTP 422 Unprocessable Entity response
 * or a local schema decode failure.
 *
 * Fields:
 * - `traceId` — optional OpenTelemetry trace ID for correlation.
 * - `problemDetail` — optional RFC 9457 problem details decoded from the response body.
 */
export class ValidationError extends HttpApiError.Problem<ValidationError>()(
  "ValidationError",
  {
    type: ProblemType.validation,
    status: 422,
    title: "Validation Failed",
  },
  {
    traceId: Schema.optional(Schema.String),
    problemDetail: Schema.optional(ProblemDetails.Schema),
  },
) {}

const notFoundErrorFromDetails = (
  traceId: string | undefined,
  detail: string | undefined,
  instance: string | undefined,
  problemDetail: ProblemDetails.ProblemDetails | undefined,
) => {
  if (detail === undefined) {
    if (instance === undefined) {
      return new NotFoundError({ traceId, problemDetail });
    }

    return new NotFoundError({ traceId, instance, problemDetail });
  }

  if (instance === undefined) {
    return new NotFoundError({ traceId, detail, problemDetail });
  }

  return new NotFoundError({ traceId, detail, instance, problemDetail });
};

const validationErrorFromDetails = (
  traceId: string | undefined,
  detail: string | undefined,
  instance: string | undefined,
  problemDetail: ProblemDetails.ProblemDetails | undefined,
) => {
  if (detail === undefined) {
    if (instance === undefined) {
      return new ValidationError({ traceId, problemDetail });
    }

    return new ValidationError({ traceId, instance, problemDetail });
  }

  if (instance === undefined) {
    return new ValidationError({ traceId, detail, problemDetail });
  }

  return new ValidationError({ traceId, detail, instance, problemDetail });
};

const decodeNotFoundProblem = (
  problemDetail: ProblemDetails.ProblemDetails | undefined,
) => {
  if (problemDetail === undefined) return Effect.succeedNone;

  return Schema.decodeUnknownEffect(NotFoundError)(problemDetail).pipe(
    Effect.option,
  );
};

const decodeValidationProblem = (
  problemDetail: ProblemDetails.ProblemDetails | undefined,
) => {
  if (problemDetail === undefined) return Effect.succeedNone;

  return Schema.decodeUnknownEffect(ValidationError)(problemDetail).pipe(
    Effect.option,
  );
};

/**
 * Effect that resolves to the trace ID of the current OpenTelemetry span, if any.
 *
 * Returns `undefined` when there is no active span (e.g. when OTel is disabled).
 *
 * @returns `string | undefined` — the current trace ID or `undefined`.
 */
export const getCurrentTraceId = Effect.gen(function* () {
  const span = yield* Effect.currentSpan.pipe(Effect.option);

  if (Option.isSome(span)) return span.value.traceId;

  return undefined;
});

/**
 * Annotates the current OpenTelemetry span with attributes derived from a
 * RFC 9457 `ProblemDetails` object.
 *
 * Attributes set: `error.type`, `error.title`, `error.status`, `error.detail`,
 * `error.instance`. Falls back to `"unknown"` or `0` for missing fields.
 *
 * @param problemDetail - The RFC 9457 problem details to extract attributes from.
 * @param statusCode - Optional HTTP status code used as fallback for `error.status`.
 * @returns An `Effect` that annotates the current span and resolves to `void`.
 */
export const annotateSpanWithProblemDetail = (
  problemDetail: ProblemDetails.ProblemDetails,
  statusCode?: number,
) =>
  Effect.annotateCurrentSpan({
    "error.type": problemDetail.type,
    "error.title": problemDetail.title ?? "unknown",
    "error.status": problemDetail.status ?? statusCode ?? 0,
    "error.detail": problemDetail.detail ?? "unknown",
    "error.instance": problemDetail.instance ?? "unknown",
  });

/**
 * Maps a `ResponseError` (from `effect/http`) to a typed domain error
 * by inspecting the HTTP status code.
 *
 * Also attempts to decode RFC 9457 Problem Details from the response body
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
      ProblemDetails.Schema,
    )(error.response).pipe(Effect.orElseSucceed(() => undefined));

    // annotate span with problem detail
    if (problemDetail !== undefined) {
      yield* annotateSpanWithProblemDetail(
        problemDetail,
        error.response.status,
      );
    }

    // map to specific error types based on status code,
    // could also map on problem detail type
    switch (error.response.status) {
      case 404: {
        const decoded = yield* decodeNotFoundProblem(problemDetail);
        let detail = problemDetail?.detail;
        let instance = problemDetail?.instance;

        if (Option.isSome(decoded)) {
          detail = decoded.value.detail;
          instance = decoded.value.instance;
        }

        return yield* notFoundErrorFromDetails(
          traceId,
          detail,
          instance,
          problemDetail,
        );
      }

      case 422: {
        const decoded = yield* decodeValidationProblem(problemDetail);
        let detail = problemDetail?.detail;
        let instance = problemDetail?.instance;

        if (Option.isSome(decoded)) {
          detail = decoded.value.detail;
          instance = decoded.value.instance;
        }

        return yield* validationErrorFromDetails(
          traceId,
          detail,
          instance,
          problemDetail,
        );
      }

      default:
        return yield* new NetworkError({ traceId });
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

    if (
      Predicate.isTagged(reason, "StatusCodeError") ||
      Predicate.isTagged(reason, "DecodeError") ||
      Predicate.isTagged(reason, "EmptyBodyError")
    ) {
      return getResponseError(reason, traceId);
    }

    return Effect.fail(new NetworkError({ traceId }));
  };
