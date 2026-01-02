import { User, UserForm } from '@/models/user';
import { Atom, Result } from '@effect-atom/atom';
import {
  HttpBody,
  HttpClientRequest,
  HttpClientResponse,
} from '@effect/platform';
import { Effect, Schema } from 'effect';
import { runtimeAtom } from '../runtime';
import { ApiClient } from './client';
import { getResponseError, NetworkError, ValidationError } from './errors';
import { simulateRandomError } from './simulation';

export const getUsersEffect = Effect.gen(function* () {
  // Simulate random errors for demo
  yield* simulateRandomError;

  const client = yield* ApiClient;
  const request = HttpClientRequest.get('/users');
  const response = yield* client.execute(request);

  // Simulate network delay for optimistic demo purposes
  yield* Effect.sleep('3 seconds');

  return yield* HttpClientResponse.schemaBodyJson(Schema.Array(User))(response);
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
);

export const usersAtom = runtimeAtom.atom(getUsersEffect);

export const createUserEffect = (
  formValues: Schema.Schema.Type<typeof UserForm>
) =>
  Effect.gen(function* () {
    const client = yield* ApiClient;

    // Simulate network delay for optimistic demo purposes
    // yield* Effect.sleep('5 seconds');

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
  );

export const createUserFn = runtimeAtom.fn(createUserEffect);

// handle optimistic updates

export const optimisticUsersAtom = Atom.optimistic(usersAtom);

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
