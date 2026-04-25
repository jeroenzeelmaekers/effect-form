import { Context, Effect, Layer, Schema } from "effect";
import {
  HttpBody,
  HttpClientRequest,
  HttpClientResponse,
} from "effect/unstable/http";

import { User, UserForm } from "@/domains/user/model";
import { ApiClient } from "@/shared/api/client";
import {
  catchHttpClientError,
  getCurrentTraceId,
  NetworkError,
  ValidationError,
} from "@/shared/api/errors";

const make = Effect.gen(function* () {
  const client = yield* Effect.service(ApiClient);

  const getUsers = Effect.fn("Get Users")(function* () {
    const traceId = yield* getCurrentTraceId;
    const request = HttpClientRequest.get("/users");
    const response = yield* client.execute(request).pipe(
      Effect.timeout("10 seconds"),
      Effect.catchTag("HttpClientError", catchHttpClientError(traceId)),
      Effect.catchTag("TimeoutError", () =>
        Effect.fail(new NetworkError({ traceId })),
      ),
    );
    return yield* HttpClientResponse.schemaBodyJson(Schema.Array(User))(
      response,
    ).pipe(
      Effect.tap((data) =>
        Effect.logInfo(`[USER] fetching ${data.length} users`),
      ),
      Effect.catchTag("SchemaError", () =>
        Effect.fail(
          new ValidationError({
            traceId,
          }),
        ),
      ),
    );
  });

  const createUser = Effect.fn("Create User")(function* (
    formValues: Schema.Schema.Type<typeof UserForm>,
  ) {
    const traceId = yield* getCurrentTraceId;
    const body = yield* HttpBody.json(formValues).pipe(
      Effect.catchTag("HttpBodyError", () =>
        Effect.fail(new ValidationError({ traceId })),
      ),
    );
    const request = HttpClientRequest.post("/users").pipe(
      HttpClientRequest.setBody(body),
    );
    const response = yield* client.execute(request).pipe(
      Effect.timeout("15 seconds"),
      Effect.catchTag("HttpClientError", catchHttpClientError(traceId)),
      Effect.catchTag("TimeoutError", () =>
        Effect.fail(new NetworkError({ traceId })),
      ),
    );
    return yield* HttpClientResponse.schemaBodyJson(User)(response).pipe(
      Effect.tap((data) =>
        Effect.logInfo(`[USER] Created user with id: ${data.id}`),
      ),
      Effect.catchTag("SchemaError", () =>
        Effect.fail(
          new ValidationError({
            traceId,
          }),
        ),
      ),
    );
  });

  return { getUsers, createUser } as const;
});

/**
 * Effect service that provides user-related API operations.
 *
 * Depends on `ApiClient` for HTTP execution. All operations are traced via
 * OpenTelemetry spans and map low-level HTTP/schema failures to typed domain
 * errors (`NetworkError`, `ValidationError`).
 *
 * Available methods (injected via `make`):
 * - `getUsers` — fetches all users from `GET /users`, returns `User[]`.
 *   Fails with `NetworkError | ValidationError`. Times out after 10 seconds.
 * - `createUser` — posts a new user to `POST /users`, returns the created `User`.
 *   Fails with `NetworkError | ValidationError`. Times out after 15 seconds.
 *
 * @example
 * const users = yield* UserService.pipe(
 *   Effect.flatMap(svc => svc.getUsers())
 * );
 */
export class UserService extends Context.Service<UserService>()("UserService", {
  make,
}) {
  /** Live `Layer` that constructs `UserService` using `ApiClient`. */
  static layer = Layer.effect(this)(this.make);
}
