import { User, UserForm } from '@/models/user';
import { Atom, Result } from '@effect-atom/atom';
import {
  HttpBody,
  HttpClientRequest,
  HttpClientResponse,
} from '@effect/platform';
import type { ResponseError } from '@effect/platform/HttpClientError';
import { Effect, Schema } from 'effect';
import { runtimeAtom } from '../runtime';
import { ApiClient } from './client';
import {
  NetworkError,
  ProblemDetail,
  UsersNotFound,
  ValidationError,
} from './errors';
import { simulateRandomError } from './simulation';

export const usersAtom = runtimeAtom.atom(
  Effect.gen(function* () {
    // Simulate random errors for demo
    yield* simulateRandomError;

    const client = yield* ApiClient;
    const request = HttpClientRequest.get('/users');
    const response = yield* client.execute(request);

    // Simulate network delay for optimistic demo purposes
    yield* Effect.sleep('3 seconds');

    return yield* HttpClientResponse.schemaBodyJson(Schema.Array(User))(
      response
    );
  }).pipe(
    Effect.timeout('5 seconds'),
    Effect.catchTags({
      RequestError: (error) =>
        Effect.fail(new NetworkError({ message: error.message })),
      ResponseError: (error) => getResponseError(error),
      ParseError: (error) =>
        Effect.fail(new ValidationError({ message: error.message })),
      TimeoutException: (error) =>
        Effect.fail(new NetworkError({ message: error.message })),
    })
  )
);

export const optimisticUsersAtom = Atom.optimistic(usersAtom);

export const createUserFn = runtimeAtom.fn(
  (formValues: Schema.Schema.Type<typeof UserForm>) =>
    Effect.gen(function* () {
      const client = yield* ApiClient;

      // Simulate network delay for optimistic demo purposes
      yield* Effect.sleep('5 seconds');

      const body = yield* HttpBody.json(formValues);
      const request = HttpClientRequest.post('/users').pipe(
        HttpClientRequest.setBody(body)
      );

      const response = yield* client.execute(request);
      return yield* HttpClientResponse.schemaBodyJson(User)(response);
    }).pipe(
      Effect.catchTags({
        RequestError: (error) =>
          Effect.fail(new NetworkError({ message: error.message })),
        ResponseError: (error) =>
          Effect.fail(new NetworkError({ message: error.message })),
        ParseError: (error) =>
          Effect.fail(new ValidationError({ message: error.message })),
        HttpBodyError: () =>
          Effect.fail(new ValidationError({ message: 'Invalid request body' })),
      })
    )
);

export const createUserOptimistic = Atom.optimisticFn(optimisticUsersAtom, {
  reducer: (currentResult, formValues) =>
    Result.map(currentResult, (currentUsers) => [
      ...currentUsers,
      {
        id: -Date.now(),
        name: formValues.name,
        username: formValues.username,
        email: formValues.email,
        language: formValues.language,
      },
    ]),
  fn: createUserFn,
});

function getResponseError(error: ResponseError) {
  return Effect.gen(function* () {
    // Try to parse the response body as Problem Detail
    const problemDetail = yield* HttpClientResponse.schemaBodyJson(
      ProblemDetail
    )(error.response);

    const message =
      problemDetail.detail ?? problemDetail.title ?? error.message;

    if (error.response.status === 404) {
      return yield* Effect.fail(new UsersNotFound({ message }));
    }

    if (
      error.response.status === 422 ||
      problemDetail.type?.includes('validation')
    ) {
      return yield* Effect.fail(new ValidationError({ message }));
    }

    return yield* Effect.fail(new NetworkError({ message }));
  }).pipe(
    // If Problem Detail parsing fails, return a generic error
    Effect.catchAll(() =>
      Effect.fail(
        new NetworkError({
          message: `Unexpected error response (${error.response.status})`,
        })
      )
    )
  );
}
