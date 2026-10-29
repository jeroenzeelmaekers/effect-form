import { Effect, Layer, ManagedRuntime } from "effect";
import {
  HttpClientRequest,
  HttpClientResponse,
  ProblemDetails,
} from "effect/http";
import { StatusCodeError } from "effect/http/HttpClientError";
import { describe, expect, it } from "vite-plus/test";

import {
  getResponseError,
  NetworkError,
  NotFoundError,
  ProblemType,
  ValidationError,
} from "./errors";

describe("Error types", () => {
  const testProblemDetail: ProblemDetails.ProblemDetails = {
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
  function createMockResponseError(status: number, bodyText: string) {
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

  const problemDetail: ProblemDetails.ProblemDetails = {
    type: "https://example.com/error",
    title: "Error",
    detail: "Something went wrong",
  };

  it.each([
    ["should return NotFoundError for 404 status", 404, "NotFoundError"],
    ["should return ValidationError for 422 status", 422, "ValidationError"],
    ["should return NetworkError for other statuses", 500, "NetworkError"],
  ])("%s", async (_, status, expectedTag) => {
    const error = createMockResponseError(
      status,
      JSON.stringify(problemDetail),
    );

    const result = await runError(getResponseError(error, "trace-1"));

    expect(result._tag).toBe(expectedTag);
  });

  it("decodes RFC 9457 defaults and preserves extension members", async () => {
    const error = createMockResponseError(
      404,
      JSON.stringify({
        status: "invalid",
        title: 42,
        detail: "The user was not found",
        errorCode: "USER_NOT_FOUND",
      }),
    );

    const result = await runError(getResponseError(error, "trace-1"));

    expect(result).toHaveProperty("type", ProblemType.notFound);
    expect(result).toMatchObject({
      problemDetail: {
        type: "about:blank",
        detail: "The user was not found",
        errorCode: "USER_NOT_FOUND",
      },
    });
    expect(result).not.toHaveProperty("problemDetail.title");
    expect(result).not.toHaveProperty("problemDetail.status");
  });

  it("decodes known problem types into native problem errors", async () => {
    const notFound = await runError(
      getResponseError(
        createMockResponseError(
          404,
          JSON.stringify({
            type: ProblemType.notFound,
            status: 404,
            title: "Resource Not Found",
            detail: "The user was not found",
            instance: "/users/1",
          }),
        ),
        "trace-404",
      ),
    );

    const validation = await runError(
      getResponseError(
        createMockResponseError(
          422,
          JSON.stringify({
            type: ProblemType.validation,
            status: 422,
            title: "Validation Failed",
            detail: "The name is required",
            instance: "/users",
          }),
        ),
        "trace-422",
      ),
    );

    expect(notFound).toBeInstanceOf(NotFoundError);
    expect(notFound).toMatchObject({
      type: ProblemType.notFound,
      status: 404,
      detail: "The user was not found",
      instance: "/users/1",
      traceId: "trace-404",
    });
    expect(validation).toBeInstanceOf(ValidationError);
    expect(validation).toMatchObject({
      type: ProblemType.validation,
      status: 422,
      detail: "The name is required",
      instance: "/users",
      traceId: "trace-422",
    });
  });

  it("ignores malformed and non-object response bodies", async () => {
    const malformed = createMockResponseError(404, "Not JSON");
    const scalar = createMockResponseError(404, JSON.stringify("Not Found"));

    const malformedResult = await runError(
      getResponseError(malformed, "trace-1"),
    );

    const scalarResult = await runError(getResponseError(scalar, "trace-1"));

    expect(malformedResult._tag).toBe("NotFoundError");
    expect(malformedResult).toHaveProperty("problemDetail", undefined);
    expect(scalarResult._tag).toBe("NotFoundError");
    expect(scalarResult).toHaveProperty("problemDetail", undefined);
  });
});
