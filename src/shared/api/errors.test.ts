import { Effect, Layer, ManagedRuntime } from "effect";
import { HttpClientRequest, HttpClientResponse } from "effect/unstable/http";
import { StatusCodeError } from "effect/unstable/http/HttpClientError";
import { describe, expect, it } from "vitest";

import {
  getResponseError,
  NetworkError,
  NotFoundError,
  ValidationError,
  type ProblemDetail,
} from "./errors";

describe("Error types", () => {
  const testProblemDetail: ProblemDetail = {
    type: "https://example.com/error",
    title: "Test Error",
    status: 500,
    detail: "test",
    instance: "/test/123",
  };

  it.each([
    [
      "NetworkError should have correct tag",
      new NetworkError({ traceId: "test-trace-id" }),
    ],
    [
      "ValidationError should have correct tag",
      new ValidationError({ problemDetail: testProblemDetail }),
    ],
    [
      "NotFoundError should have correct tag",
      new NotFoundError({ problemDetail: testProblemDetail }),
    ],
  ])("%s", (_, error) => {
    expect(error._tag).toBe(error.constructor.name);
  });

  it("should allow access to all problemDetail fields", () => {
    const error = new ValidationError({ problemDetail: testProblemDetail });
    expect(error.problemDetail?.type).toBe("https://example.com/error");
    expect(error.problemDetail?.title).toBe("Test Error");
    expect(error.problemDetail?.status).toBe(500);
    expect(error.problemDetail?.detail).toBe("test");
    expect(error.problemDetail?.instance).toBe("/test/123");
  });
});

describe("getResponseError", () => {
  function createMockResponseError(status: number, body: unknown) {
    const bodyText = JSON.stringify(body);
    const request = HttpClientRequest.get("https://test.com");
    const response = HttpClientResponse.fromWeb(
      request,
      new Response(bodyText, {
        status,
      }),
    );
    return new StatusCodeError({
      request,
      response,
    });
  }

  const runtime = ManagedRuntime.make(Layer.empty);

  const runError = <E>(effect: Effect.Effect<never, E>) =>
    runtime.runPromise(Effect.flip(effect));

  const problemDetail: ProblemDetail = {
    type: "https://example.com/error",
    title: "Error",
    detail: "Something went wrong",
  };

  it.each([
    ["should return NotFoundError for 404 status", 404, "NotFoundError"],
    ["should return ValidationError for 422 status", 422, "ValidationError"],
    ["should return NetworkError for other statuses", 500, "NetworkError"],
  ])("%s", async (_, status, expectedTag) => {
    const error = createMockResponseError(status, problemDetail);
    const result = await runError(getResponseError(error, "trace-1"));
    expect(result._tag).toBe(expectedTag);
  });

  it("should handle non-JSON responses gracefully", async () => {
    const error = createMockResponseError(404, "Not Found");
    const result = await runError(getResponseError(error, "trace-1"));
    expect(result._tag).toBe("NotFoundError");
  });
});
