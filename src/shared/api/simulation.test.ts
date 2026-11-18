import { beforeEach, describe, expect, it, vi } from "@effect/vitest";
import { Duration, Effect, Fiber, Random } from "effect";
import {
  HttpClientError,
  HttpClientRequest,
  HttpClientResponse,
  ProblemDetails,
} from "effect/http";
import { TestClock } from "effect/testing";

import { ProblemType } from "./errors";
import { simulateRequest } from "./simulation";

const request = HttpClientRequest.get("https://example.com/users");

const createResponse = (
  responseRequest: HttpClientRequest.HttpClientRequest,
  status: number,
  body: unknown,
) =>
  HttpClientResponse.fromWeb(
    responseRequest,
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": ProblemDetails.contentType },
    }),
  );

const withRandom = <A, E, R>(
  value: number,
  effect: Effect.Effect<A, E, R>,
) =>
  Effect.provideService(effect, Random.Random, {
    nextIntUnsafe: () => 0,
    nextDoubleUnsafe: () => value,
  });

const runSimulation = (
  value: number,
  execute: Parameters<typeof simulateRequest>[1],
) => withRandom(value, simulateRequest(request, execute));

const mockExecute = vi.fn((req: HttpClientRequest.HttpClientRequest) =>
  Effect.succeed(createResponse(req, 200, { ok: true })),
);

beforeEach(() => {
  mockExecute.mockClear();
});

describe("simulateRequest", () => {
  it.effect("fails with a transport error for the first 20%", () =>
    Effect.gen(function* () {
      const fiber = yield* runSimulation(0.1, mockExecute).pipe(
        Effect.forkChild,
      );

      yield* TestClock.adjust(Duration.seconds(3));

      const error = yield* Fiber.join(fiber).pipe(Effect.flip);
      expect(error).toBeInstanceOf(HttpClientError.HttpClientError);
      expect(error.reason).toBeInstanceOf(HttpClientError.TransportError);
      expect(mockExecute).not.toHaveBeenCalled();
    }),
  );

  it.effect("returns a Problem Details 404 for random values below 0.35", () =>
    Effect.gen(function* () {
      const fiber = yield* runSimulation(0.3, mockExecute).pipe(
        Effect.forkChild,
      );

      yield* TestClock.adjust(Duration.seconds(3));

      const response = yield* Fiber.join(fiber);
      const problem = yield* HttpClientResponse.schemaBodyJson(
        ProblemDetails.Schema,
      )(response);

      expect(response.status).toBe(404);
      expect(problem).toMatchObject({
        type: ProblemType.notFound,
        title: "Resource Not Found",
        status: 404,
      });
      expect(mockExecute).not.toHaveBeenCalled();
    }),
  );

  it.effect("returns a Problem Details 422 between 0.35 and 0.45", () =>
    Effect.gen(function* () {
      const fiber = yield* runSimulation(0.4, mockExecute).pipe(
        Effect.forkChild,
      );

      yield* TestClock.adjust(Duration.seconds(3));

      const response = yield* Fiber.join(fiber);
      const problem = yield* HttpClientResponse.schemaBodyJson(
        ProblemDetails.Schema,
      )(response);

      expect(response.status).toBe(422);
      expect(problem).toMatchObject({
        type: ProblemType.validation,
        title: "Validation Failed",
        status: 422,
      });
      expect(mockExecute).not.toHaveBeenCalled();
    }),
  );

  it.effect(
    "delegates successful values and delays every request by 3 seconds",
    () =>
      Effect.gen(function* () {
        const fiber = yield* runSimulation(0.5, mockExecute).pipe(
          Effect.forkChild,
        );

        yield* TestClock.adjust(Duration.seconds(2));
        expect(mockExecute).not.toHaveBeenCalled();

        yield* TestClock.adjust(Duration.seconds(1));

        const response = yield* Fiber.join(fiber);
        expect(response.status).toBe(200);
        expect(mockExecute).toHaveBeenCalledOnce();
        expect(mockExecute).toHaveBeenCalledWith(request);
      }),
  );
});
