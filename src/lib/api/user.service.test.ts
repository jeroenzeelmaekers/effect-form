import { NetworkError, ValidationError } from '@/lib/api/errors';
import { UserService } from '@/lib/api/user.service';
import { createMockApiClient, createMockResponse } from '@/test/mock-client';
import { it } from '@effect/vitest';
import { Duration, Effect, Exit, Fiber, Layer, TestClock } from 'effect';
import { beforeEach, describe, expect, vi } from 'vitest';

// Mock Math.random to always return success (>= 0.45 skips all simulated errors)
beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
});

const createTestLayer = (handler: Parameters<typeof createMockApiClient>[0]) =>
  UserService.Default.pipe(Layer.provide(createMockApiClient(handler)));

describe('UserService', () => {
  describe('Get users', () => {
    it.scoped('should return users on successful response', () =>
      Effect.gen(function* () {
        const mockUsers = [
          {
            id: 1,
            name: 'John Doe',
            username: 'johndoe',
            email: 'john@example.com',
          },
          {
            id: 2,
            name: 'Jane Doe',
            username: 'janedoe',
            email: 'jane@example.com',
          },
        ];

        const fiber = yield* UserService.getUsers().pipe(
          Effect.provide(
            createTestLayer(() =>
              Effect.succeed(createMockResponse(200, mockUsers)),
            ),
          ),
          Effect.fork,
        );

        // Fast-forward through the 3 second sleep
        yield* TestClock.adjust(Duration.seconds(3));

        const result = yield* Fiber.join(fiber);
        expect(result).toEqual(mockUsers);
      }),
    );

    it.scoped('should fail with ValidationError on invalid response body', () =>
      Effect.gen(function* () {
        const invalidBody = [{ invalid: 'data' }];

        const fiber = yield* UserService.getUsers().pipe(
          Effect.provide(
            createTestLayer(() =>
              Effect.succeed(createMockResponse(200, invalidBody)),
            ),
          ),
          Effect.fork,
        );

        // Fast-forward through the 3 second sleep
        yield* TestClock.adjust(Duration.seconds(3));

        const exit = yield* Fiber.join(fiber).pipe(Effect.exit);

        expect(Exit.isFailure(exit)).toBe(true);
        if (Exit.isFailure(exit)) {
          const error = exit.cause;
          expect(error._tag).toBe('Fail');
          if (error._tag === 'Fail') {
            expect(error.error).toBeInstanceOf(ValidationError);
          }
        }
      }),
    );

    it.scoped('should fail with NetworkError on request timeout', () =>
      Effect.gen(function* () {
        const fiber = yield* UserService.getUsers().pipe(
          Effect.provide(
            createTestLayer(() =>
              // Simulate a slow response that exceeds the 10 second timeout
              Effect.sleep('15 seconds').pipe(
                Effect.map(() => createMockResponse(200, [])),
              ),
            ),
          ),
          Effect.fork,
        );

        // Fast-forward past the 10 second timeout
        yield* TestClock.adjust(Duration.seconds(15));

        const exit = yield* Fiber.join(fiber).pipe(Effect.exit);

        expect(Exit.isFailure(exit)).toBe(true);
        if (Exit.isFailure(exit)) {
          const error = exit.cause;
          expect(error._tag).toBe('Fail');
          if (error._tag === 'Fail') {
            expect(error.error).toBeInstanceOf(NetworkError);
          }
        }
      }),
    );
  });

  describe('Create user', () => {
    const validFormData = {
      name: 'Test User',
      username: 'testuser',
      email: 'test@example.com',
      language: 'en',
    };

    it.scoped('should create user on successful response', () =>
      Effect.gen(function* () {
        const createdUser = {
          id: 1,
          ...validFormData,
        };

        const fiber = yield* UserService.createUser(validFormData).pipe(
          Effect.provide(
            createTestLayer(() =>
              Effect.succeed(createMockResponse(201, createdUser)),
            ),
          ),
          Effect.fork,
        );

        // Fast-forward through the 5 second sleep
        yield* TestClock.adjust(Duration.seconds(5));

        const result = yield* Fiber.join(fiber);
        expect(result).toEqual(createdUser);
      }),
    );

    it.scoped('should fail with ValidationError on invalid response body', () =>
      Effect.gen(function* () {
        const invalidResponse = { invalid: 'data' };

        const fiber = yield* UserService.createUser(validFormData).pipe(
          Effect.provide(
            createTestLayer(() =>
              Effect.succeed(createMockResponse(201, invalidResponse)),
            ),
          ),
          Effect.fork,
        );

        // Fast-forward through the 5 second sleep
        yield* TestClock.adjust(Duration.seconds(5));

        const exit = yield* Fiber.join(fiber).pipe(Effect.exit);

        expect(Exit.isFailure(exit)).toBe(true);
        if (Exit.isFailure(exit)) {
          const error = exit.cause;
          expect(error._tag).toBe('Fail');
          if (error._tag === 'Fail') {
            expect(error.error).toBeInstanceOf(ValidationError);
          }
        }
      }),
    );
  });
});
