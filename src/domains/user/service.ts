import { Effect, Layer, Schema, ServiceMap } from "effect";
import {
  HttpBody,
  HttpClientRequest,
  HttpClientResponse,
} from "effect/unstable/http";

import { User, UserForm } from "@/domains/user/model";
import { ApiClient } from "@/shared/api/client";
import {
  getCurrentTraceId,
  getResponseError,
  NetworkError,
  ValidationError,
} from "@/shared/api/errors";

const make = Effect.gen(function* () {
  const client = yield* ApiClient;

  const getUsers = Effect.fn("Get Users")(function* () {
    const traceId = yield* getCurrentTraceId;
    const request = HttpClientRequest.get("/users");
    const response = yield* client.execute(request).pipe(
      Effect.timeout("10 seconds"),
      Effect.catchTag("HttpClientError", (error) => {
        const reason = error.reason;
        switch (reason._tag) {
          case "StatusCodeError":
          case "DecodeError":
          case "EmptyBodyError":
            return getResponseError(reason, traceId);
          default:
            return Effect.fail(new NetworkError({ traceId }));
        }
      }),
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

  const createUser = Effect.fn("Create Users")(function* (
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
      Effect.catchTag("HttpClientError", (error) => {
        const reason = error.reason;
        switch (reason._tag) {
          case "StatusCodeError":
          case "DecodeError":
          case "EmptyBodyError":
            return getResponseError(reason, traceId);
          default:
            return Effect.fail(new NetworkError({ traceId }));
        }
      }),
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

export class UserService extends ServiceMap.Service<UserService>()(
  "UserService",
  {
    make,
  },
) {
  static layer = Layer.effect(this, this.make);
}
