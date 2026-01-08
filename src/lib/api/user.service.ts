import { User, UserForm } from '@/models/user';
import {
  HttpBody,
  HttpClientRequest,
  HttpClientResponse,
} from '@effect/platform';
import { Effect, flow, Schema } from 'effect';
import { ApiClient } from './client';
import { getResponseError, NetworkError, ValidationError } from './errors';
import { simulateRandomError } from './simulation';

export class UserService extends Effect.Service<UserService>()('UserService', {
  accessors: true,
  scoped: Effect.gen(function* () {
    const client = yield* ApiClient;

    const getUsers = Effect.fn('Get Users')(
      function* () {
        const request = HttpClientRequest.get('/users');
        const response = yield* client.execute(request);
        // Simulate network delay for optimistic demo purposes
        yield* Effect.sleep('3 seconds');
        // Simulate random errors for demo
        yield* simulateRandomError;
        return yield* HttpClientResponse.schemaBodyJson(Schema.Array(User))(
          response
        );
      },
      flow(
        Effect.timeout('10 seconds'),
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

    const createUser = Effect.fn('Create Users')(
      function* (formValues: Schema.Schema.Type<typeof UserForm>) {
        yield* Effect.sleep('5 seconds');
        const body = yield* HttpBody.json(formValues);
        const request = HttpClientRequest.post('/users').pipe(
          HttpClientRequest.setBody(body)
        );
        const response = yield* client.execute(request);
        return yield* HttpClientResponse.schemaBodyJson(User)(response);
      },
      flow(
        Effect.catchTags({
          RequestError: (error) =>
            Effect.fail(new NetworkError({ message: error.message })),
          ResponseError: (error) =>
            Effect.fail(new NetworkError({ message: error.message })),
          ParseError: (error) =>
            Effect.fail(new ValidationError({ message: error.message })),
          HttpBodyError: () =>
            Effect.fail(
              new ValidationError({ message: 'Invalid request body' })
            ),
        }),
        Effect.tap((data) =>
          Effect.logInfo('[USER] Created user: ' + JSON.stringify(data))
        )
      )
    );

    return { getUsers, createUser } as const;
  }),
}) {}
