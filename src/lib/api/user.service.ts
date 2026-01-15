import { User, UserForm } from '@/models/user';
import {
  HttpBody,
  HttpClientRequest,
  HttpClientResponse,
} from '@effect/platform';
import { Effect, Schema } from 'effect';
import { ApiClient } from './client';
import {
  getCurrentTraceId,
  getResponseError,
  NetworkError,
  ValidationError,
} from './errors';

export class UserService extends Effect.Service<UserService>()('UserService', {
  accessors: true,
  scoped: Effect.gen(function* () {
    const client = yield* ApiClient;

    const getUsers = Effect.fn('Get Users')(function* () {
      const traceId = yield* getCurrentTraceId;
      const request = HttpClientRequest.get('/users');
      const response = yield* client.execute(request).pipe(
        Effect.timeout('10 seconds'),
        Effect.catchTags({
          RequestError: () =>
            Effect.fail(
              new NetworkError({
                traceId,
              }),
            ),
          ResponseError: (error) => getResponseError(error, traceId),
          TimeoutException: () => Effect.fail(new NetworkError({ traceId })),
        }),
      );
      return yield* HttpClientResponse.schemaBodyJson(Schema.Array(User))(
        response,
      ).pipe(
        Effect.catchTags({
          ParseError: () =>
            Effect.fail(
              new ValidationError({
                traceId,
              }),
            ),
        }),
      );
    });

    const createUser = Effect.fn('Create Users')(function* (
      formValues: Schema.Schema.Type<typeof UserForm>,
    ) {
      const traceId = yield* getCurrentTraceId;
      const body = yield* HttpBody.json(formValues).pipe(
        Effect.catchTag('HttpBodyError', () =>
          Effect.fail(new ValidationError({ traceId })),
        ),
      );
      const request = HttpClientRequest.post('/users').pipe(
        HttpClientRequest.setBody(body),
      );
      const response = yield* client.execute(request).pipe(
        Effect.catchTags({
          RequestError: () =>
            Effect.fail(
              new NetworkError({
                traceId,
              }),
            ),
          ResponseError: (error) => getResponseError(error, traceId),
        }),
      );
      return yield* HttpClientResponse.schemaBodyJson(User)(response).pipe(
        Effect.tap((data) =>
          Effect.logInfo('[USER] Created user: ' + JSON.stringify(data)),
        ),
        Effect.catchTag('ParseError', () =>
          Effect.fail(
            new ValidationError({
              traceId,
            }),
          ),
        ),
      );
    });

    return { getUsers, createUser } as const;
  }),
}) {}
