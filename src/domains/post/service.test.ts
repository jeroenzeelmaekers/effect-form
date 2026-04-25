import { beforeEach, describe, expect, it, vi } from "@effect/vitest";
import { Cause, Duration, Effect, Exit, Fiber, Layer } from "effect";
import { TestClock } from "effect/testing";

import { PostService } from "@/domains/post/service";
import { NetworkError, ValidationError } from "@/shared/api/errors";
import { createMockApiClient, createMockResponse } from "@/test/mock-client";

beforeEach(() => {
  vi.spyOn(Math, "random").mockReturnValue(0.5);
});

const createTestLayer = (handler: Parameters<typeof createMockApiClient>[0]) =>
  PostService.layer.pipe(Layer.provide(createMockApiClient(handler)));

const mockPosts = [
  {
    id: 1,
    title: "First Post",
    body: "This is the body of the first post.",
    userId: 1,
  },
  {
    id: 2,
    title: "Second Post",
    body: "This is the body of the second post.",
    userId: 1,
  },
];

describe("PostService", () => {
  describe("Get posts", () => {
    it.effect("should return posts on successful response", () =>
      Effect.gen(function* () {
        const postService = yield* Effect.service(PostService);

        const fiber = yield* postService.getPosts().pipe(Effect.forkChild);

        // Fast-forward through the 2 second sleep
        yield* TestClock.adjust(Duration.seconds(2));

        const result = yield* Fiber.join(fiber);
        expect(result).toEqual(mockPosts);
      }).pipe(
        Effect.provide(
          createTestLayer(() =>
            Effect.succeed(createMockResponse(200, mockPosts)),
          ),
        ),
      ),
    );

    it.effect("should fail with ValidationError on invalid response body", () =>
      Effect.gen(function* () {
        const postService = yield* Effect.service(PostService);
        const fiber = yield* postService.getPosts().pipe(Effect.forkChild);

        yield* TestClock.adjust(Duration.seconds(2));

        const exit = yield* Fiber.join(fiber).pipe(Effect.exit);

        expect(Exit.isFailure(exit)).toBe(true);
        if (Exit.isFailure(exit)) {
          const failReason = exit.cause.reasons.find(Cause.isFailReason);
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
        const postService = yield* Effect.service(PostService);
        const fiber = yield* postService.getPosts().pipe(Effect.forkChild);

        // Fast-forward past the 10 second timeout
        yield* TestClock.adjust(Duration.seconds(15));

        const exit = yield* Fiber.join(fiber).pipe(Effect.exit);

        expect(Exit.isFailure(exit)).toBe(true);
        if (Exit.isFailure(exit)) {
          const failReason = exit.cause.reasons.find(Cause.isFailReason);
          expect(failReason).toBeDefined();
          if (failReason && Cause.isFailReason(failReason)) {
            expect(failReason.error).toBeInstanceOf(NetworkError);
          }
        }
      }).pipe(
        Effect.provide(
          createTestLayer(() =>
            Effect.sleep("15 seconds").pipe(
              Effect.map(() => createMockResponse(200, [])),
            ),
          ),
        ),
      ),
    );
  });
});
