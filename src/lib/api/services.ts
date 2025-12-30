import { Atom, Result } from "@effect-atom/atom";
import { Effect, Schema } from "effect";
import { ApiClient } from "./client";
import {
  HttpClientRequest,
  HttpClientResponse,
  HttpBody,
} from "@effect/platform";
import { User, UserForm } from "@/models/user";
import { NetworkError, UsersNotFound, ValidationError } from "./errors";
import { runtimeAtom } from "../runtime";

// Random error simulation for demo purposes
const simulateRandomError = Effect.gen(function* () {
  const random = Math.random();

  // 20% chance of NetworkError
  if (random < 0.2) {
    yield* Effect.fail(
      new NetworkError({
        message: "Connection timed out - server unreachable",
      }),
    );
  }
  // 15% chance of UsersNotFound (404)
  else if (random < 0.35) {
    yield* Effect.fail(new UsersNotFound({ message: "No users found" }));
  }
  // 10% chance of ValidationError
  else if (random < 0.45) {
    yield* Effect.fail(
      new ValidationError({ message: "Invalid response format from server" }),
    );
  }
  // 55% chance of success - continue normally
});

export const usersAtom = runtimeAtom.atom(
  Effect.gen(function* () {
    // Simulate random errors for demo
    yield* simulateRandomError;

    const client = yield* ApiClient;
    const request = HttpClientRequest.get("/users");
    const response = yield* client.execute(request);
    return yield* HttpClientResponse.schemaBodyJson(Schema.Array(User))(
      response,
    );
  }).pipe(
    Effect.timeout("5 seconds"),
    Effect.catchTags({
      RequestError: (error) =>
        Effect.fail(new NetworkError({ message: error.message })),
      ResponseError: (error) =>
        error.response.status === 404
          ? Effect.fail(new UsersNotFound({ message: error.message }))
          : Effect.fail(new NetworkError({ message: error.message })),
      ParseError: (error) =>
        Effect.fail(new ValidationError({ message: error.message })),
      TimeoutException: (error) =>
        Effect.fail(new NetworkError({ message: error.message })),
    }),
  ),
);

export const optimisticUsersAtom = Atom.optimistic(usersAtom);

export const createUserFn = runtimeAtom.fn(
  (formValues: Schema.Schema.Type<typeof UserForm>) =>
    Effect.gen(function* () {
      const client = yield* ApiClient;

      // Simulate network delay
      yield* Effect.sleep("3 seconds");

      const body = yield* HttpBody.json(formValues);
      const request = HttpClientRequest.post("/users").pipe(
        HttpClientRequest.setBody(body),
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
          Effect.fail(new ValidationError({ message: "Invalid request body" })),
      }),
    ),
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
