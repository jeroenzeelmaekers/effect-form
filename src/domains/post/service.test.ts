import { beforeEach, describe, expect, it, vi } from "@effect/vitest";
import { Duration, Effect, Fiber, Layer } from "effect";
import { TestClock } from "effect/testing";

import { PostService } from "@/domains/post/service";
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
        const postService = yield* PostService;

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
  });
});
