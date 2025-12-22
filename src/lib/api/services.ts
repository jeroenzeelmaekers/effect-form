import { Atom } from "@effect-atom/atom-react";
import { Effect, Schema } from "effect";
import { ApiClient, ApiLive } from "./client";
import { HttpClientRequest, HttpClientResponse } from "@effect/platform";
import { User } from "@/models/user";
import { NetworkError, UserNotFound, ValidationError } from "./errors";

export const runtimeAtom = Atom.runtime(ApiLive);

export const usersAtom = runtimeAtom.atom(
  Effect.gen(function* () {
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
          ? Effect.fail(new UserNotFound({ userId: 0 }))
          : Effect.fail(new NetworkError({ message: error.message })),
      ParseError: (error) =>
        Effect.fail(new ValidationError({ message: error.message })),
      TimeoutException: (error) =>
        Effect.fail(new NetworkError({ message: error.message })),
    }),
  ),
);
