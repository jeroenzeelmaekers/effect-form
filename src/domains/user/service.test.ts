import { beforeEach, describe, expect, it, vi } from "@effect/vitest";
import { Cause, Duration, Effect, Exit, Fiber, Layer } from "effect";
import { TestClock } from "effect/testing";

import { UserService } from "@/domains/user/service";
import { NetworkError, ValidationError } from "@/shared/api/errors";
import { createMockApiClient, createMockResponse } from "@/test/mock-client";

// Mock Math.random to always return success (>= 0.45 skips all simulated errors)
beforeEach(() => {
  vi.spyOn(Math, "random").mockReturnValue(0.5);
});

const createTestLayer = (handler: Parameters<typeof createMockApiClient>[0]) =>
  UserService.layer.pipe(Layer.provide(createMockApiClient(handler)));

describe("UserService", () => {
  describe("Get users", () => {
    it.effect("should return users on successful response", () =>
      Effect.gen(function* () {
        const svc = yield* UserService;
        const fiber = yield* svc.getUsers().pipe(Effect.forkChild);

        // Fast-forward through the 3 second sleep
        yield* TestClock.adjust(Duration.seconds(3));

        const result = yield* Fiber.join(fiber);
        expect(result).toEqual([
          {
            _tag: "User",
            id: 1,
            name: "John Doe",
            username: "johndoe",
            email: "john@example.com",
          },
          {
            _tag: "User",
            id: 2,
            name: "Jane Doe",
            username: "janedoe",
            email: "jane@example.com",
          },
        ]);
      }).pipe(
        Effect.provide(
          createTestLayer(() =>
            Effect.succeed(
              createMockResponse(200, [
                {
                  id: 1,
                  name: "John Doe",
                  username: "johndoe",
                  email: "john@example.com",
                },
                {
                  id: 2,
                  name: "Jane Doe",
                  username: "janedoe",
                  email: "jane@example.com",
                },
              ]),
            ),
          ),
        ),
      ),
    );

    it.effect("should fail with ValidationError on invalid response body", () =>
      Effect.gen(function* () {
        const svc = yield* UserService;
        const fiber = yield* svc.getUsers().pipe(Effect.forkChild);

        // Fast-forward through the 3 second sleep
        yield* TestClock.adjust(Duration.seconds(3));

        const exit = yield* Fiber.join(fiber).pipe(Effect.exit);

        expect(Exit.isFailure(exit)).toBe(true);
        if (Exit.isFailure(exit)) {
          const cause = exit.cause;
          const failReason = cause.reasons.find(Cause.isFailReason);
          expect(failReason).toBeDefined();
          if (failReason && Cause.isFailReason(failReason)) {
            expect(failReason.error).toBeInstanceOf(ValidationError);
          }
        }
      }).pipe(
        Effect.provide(
          createTestLayer(() =>
            Effect.succeed(createMockResponse(200, [{ invalid: "data" }])),
          ),
        ),
      ),
    );

    it.effect("should fail with NetworkError on request timeout", () =>
      Effect.gen(function* () {
        const svc = yield* UserService;
        const fiber = yield* svc.getUsers().pipe(Effect.forkChild);

        // Fast-forward past the 10 second timeout
        yield* TestClock.adjust(Duration.seconds(15));

        const exit = yield* Fiber.join(fiber).pipe(Effect.exit);

        expect(Exit.isFailure(exit)).toBe(true);
        if (Exit.isFailure(exit)) {
          const cause = exit.cause;
          const failReason = cause.reasons.find(Cause.isFailReason);
          expect(failReason).toBeDefined();
          if (failReason && Cause.isFailReason(failReason)) {
            expect(failReason.error).toBeInstanceOf(NetworkError);
          }
        }
      }).pipe(
        Effect.provide(
          createTestLayer(() =>
            // Simulate a slow response that exceeds the 10 second timeout
            Effect.sleep("15 seconds").pipe(
              Effect.map(() => createMockResponse(200, [])),
            ),
          ),
        ),
      ),
    );
  });

  describe("Create user", () => {
    const validFormData = {
      _tag: "UserForm" as const,
      name: "Test User",
      username: "testuser",
      email: "test@example.com",
      language: "en",
    };

    it.effect("should create user on successful response", () =>
      Effect.gen(function* () {
        const svc = yield* UserService;
        const fiber = yield* svc
          .createUser(validFormData)
          .pipe(Effect.forkChild);

        // Fast-forward through the 5 second sleep
        yield* TestClock.adjust(Duration.seconds(5));

        const result = yield* Fiber.join(fiber);
        expect(result).toEqual({
          _tag: "User",
          id: 1,
          name: "Test User",
          username: "testuser",
          email: "test@example.com",
          language: "en",
        });
      }).pipe(
        Effect.provide(
          createTestLayer(() =>
            Effect.succeed(
              createMockResponse(201, {
                id: 1,
                name: "Test User",
                username: "testuser",
                email: "test@example.com",
                language: "en",
              }),
            ),
          ),
        ),
      ),
    );

    it.effect("should fail with ValidationError on invalid response body", () =>
      Effect.gen(function* () {
        const svc = yield* UserService;
        const fiber = yield* svc
          .createUser(validFormData)
          .pipe(Effect.forkChild);

        // Fast-forward through the 5 second sleep
        yield* TestClock.adjust(Duration.seconds(5));

        const exit = yield* Fiber.join(fiber).pipe(Effect.exit);

        expect(Exit.isFailure(exit)).toBe(true);
        if (Exit.isFailure(exit)) {
          const cause = exit.cause;
          const failReason = cause.reasons.find(Cause.isFailReason);
          expect(failReason).toBeDefined();
          if (failReason && Cause.isFailReason(failReason)) {
            expect(failReason.error).toBeInstanceOf(ValidationError);
          }
        }
      }).pipe(
        Effect.provide(
          createTestLayer(() =>
            Effect.succeed(createMockResponse(201, { invalid: "data" })),
          ),
        ),
      ),
    );
  });
});
