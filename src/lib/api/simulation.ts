import { Effect, type Schema } from 'effect';
import {
  NetworkError,
  UsersNotFound,
  ValidationError,
  type ProblemDetail,
} from './errors';

const mockProblemDetails = {
  notFound: {
    type: 'https://api.example.com/problems/not-found',
    title: 'Resource Not Found',
    status: 404,
    detail: 'The requested users collection could not be found.',
    instance: '/users',
  },
  validation: {
    type: 'https://api.example.com/problems/validation-error',
    title: 'Validation Failed',
    status: 422,
    detail: 'The request payload contains invalid data.',
    instance: '/users',
  },
  serverError: {
    type: 'https://api.example.com/problems/internal-error',
    title: 'Internal Server Error',
    status: 500,
    detail: 'An unexpected error occurred while processing your request.',
    instance: '/users',
  },
} satisfies Record<string, Schema.Schema.Type<typeof ProblemDetail>>;

// Random error simulation for demo purposes using Problem Details
export const simulateRandomError = Effect.gen(function* () {
  const random = Math.random();

  // 20% chance of NetworkError (connection level - no Problem Detail)
  if (random < 0.2) {
    yield* Effect.fail(
      new NetworkError({
        message: 'Connection timed out - server unreachable',
      })
    );
  }
  // 15% chance of NotFound (404 with Problem Detail)
  else if (random < 0.35) {
    yield* Effect.fail(
      new UsersNotFound({
        message: mockProblemDetails.notFound.detail,
      })
    );
  }
  // 10% chance of ValidationError (422 with Problem Detail)
  else if (random < 0.45) {
    yield* Effect.fail(
      new ValidationError({
        message: mockProblemDetails.validation.detail,
      })
    );
  }
  // 55% chance of success - continue normally
});
