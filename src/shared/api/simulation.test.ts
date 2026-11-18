import { afterEach, beforeEach, describe, expect, it, vi } from "@effect/vitest";
import { Duration, Effect, Fiber } from "effect";
import { HttpClient, HttpClientRequest, HttpClientResponse } from "effect/http";
import { TestClock } from "effect/testing";

import { simulateRequest, withSimulation } from "./simulation";

const request = HttpClientRequest.get("https://api.example.com/users");

beforeEach(() => {
  vi.spyOn(Math, "random").mockReturnValue(0.5);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("simulateRequest", () => {
  it.effect("returns a transport error for the first probability range", () =>
    Effect.gen(function* () {
      vi.spyOn(Math, "random").mockReturnValue(0.1);
      const execute = vi.fn(() =>
        Effect.succeed(HttpClientResponse.fromWeb(request, new Response())),
      );
      const fiber = yield* simulateRequest(request, execute).pipe(
        Effect.either,
        Effect.forkChild,
      );

      yield* TestClock.adjust(Duration.seconds(3));
      const result = yield* Fiber.join(fiber);

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.reason._tag).toBe("TransportError");
        expect(result.left.reason).toMatchObject({
          description: "Connection timed out - server unreachable",
        });
      }
      expect(execute).not.toHaveBeenCalled();
    }),
  );

  it.effect("returns a 404 Problem Details response in the 404 range", () =>
    Effect.gen(function* () {
      vi.spyOn(Math, "random").mockReturnValue(0.2);
      const execute = vi.fn(() =>
        Effect.succeed(HttpClientResponse.fromWeb(request, new Response())),
      );
      const fiber = yield* simulateRequest(request, execute).pipe(
        Effect.forkChild,
      );

      yield* TestClock.adjust(Duration.seconds(3));
      const response = yield* Fiber.join(fiber);

      expect(response.status).toBe(404);
      expect(execute).not.toHaveBeenCalled();
    }),
  );

  it.effect(
    "returns a 422 Problem Details response in the validation range",
    () =>
      Effect.gen(function* () {
        vi.spyOn(Math, "random").mockReturnValue(0.35);
        const execute = vi.fn(() =>
          Effect.succeed(HttpClientResponse.fromWeb(request, new Response())),
        );
        const fiber = yield* simulateRequest(request, execute).pipe(
          Effect.forkChild,
        );

        yield* TestClock.adjust(Duration.seconds(3));
        const response = yield* Fiber.join(fiber);

        expect(response.status).toBe(422);
        expect(execute).not.toHaveBeenCalled();
      }),
  );

  it.effect(
    "delegates to the real request in the success range after the delay",
    () =>
      Effect.gen(function* () {
        vi.spyOn(Math, "random").mockReturnValue(0.5);
        const expected = HttpClientResponse.fromWeb(
          request,
          new Response(null, { status: 200 }),
        );
        const execute = vi.fn(() => Effect.succeed(expected));
        const fiber = yield* simulateRequest(request, execute).pipe(
          Effect.forkChild,
        );

        yield* TestClock.adjust(Duration.seconds(2));
        expect(execute).not.toHaveBeenCalled();

        yield* TestClock.adjust(Duration.seconds(1));
        const response = yield* Fiber.join(fiber);

        expect(response).toBe(expected);
        expect(execute).toHaveBeenCalledWith(request);
      }),
  );
});

describe("withSimulation", () => {
  it.effect("converts a simulated non-2xx response into a client error", () =>
    Effect.gen(function* () {
      vi.spyOn(Math, "random").mockReturnValue(0.2);
      const realClient = HttpClient.make(() =>
        Effect.die("the real client should not be called"),
      );
      const client = withSimulation(realClient);
      const fiber = yield* client.execute(request).pipe(
        Effect.either,
        Effect.forkChild,
      );

      yield* TestClock.adjust(Duration.seconds(3));
      const result = yield* Fiber.join(fiber);

      expect(result._tag).toBe("Left");
    }),
  );
});
