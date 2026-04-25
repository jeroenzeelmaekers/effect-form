import { Effect, Schema, Stream, SubscriptionRef } from "effect";
import { Atom, AsyncResult } from "effect/unstable/reactivity";

import { FilterRef } from "@/domains/user/filter-ref";
import { User, UserForm, UserId } from "@/domains/user/model";
import { UserService } from "@/domains/user/service";
import { runtimeAtom } from "@/infrastructure/runtime";

/**
 * Reactive atom that fetches the full list of users from the API.
 *
 * Subscribed components automatically re-render whenever the `"users"`
 * reactivity key is invalidated (e.g. after a successful create). The atom
 * runs `UserService.getUsers` inside the shared application runtime.
 */
export const getUsersAtom = runtimeAtom
  .atom(
    Effect.gen(function* () {
      const svc = yield* Effect.service(UserService);
      return yield* svc.getUsers();
    }),
  )
  .pipe(Atom.withReactivity({ users: ["users"] }));

/**
 * Reactive atom factory that creates a new user via the API.
 *
 * Call the returned function with a `UserForm` value to trigger a `POST /users`
 * request. On success the `"users"` reactivity key is invalidated, causing
 * `getUsersAtom` (and any other atoms keyed on `"users"`) to refresh.
 *
 * @param formValues - Validated form payload conforming to the `UserForm` schema.
 * @returns An `Effect` that resolves to the newly created `User`.
 */
export const createUserAtom = runtimeAtom.fn(
  (formValues: Schema.Schema.Type<typeof UserForm>) =>
    Effect.gen(function* () {
      const svc = yield* Effect.service(UserService);
      return yield* svc.createUser(formValues);
    }),
  {
    reactivityKeys: { users: ["users"] },
  },
);

// Optimistic updates

/**
 * Optimistic wrapper around `getUsersAtom`.
 *
 * Holds a locally patched copy of the users list while an async mutation is
 * in flight. Use this atom in place of `getUsersAtom` to display optimistic UI.
 */
export const optimisticGetUsersAtom = Atom.optimistic(getUsersAtom);

const createTempUser = (formValues: UserForm): User =>
  new User({
    id: -Date.now() as UserId,
    name: formValues.name,
    username: formValues.username,
    email: formValues.email,
    language: formValues.language,
  });

/**
 * Optimistic atom that immediately appends a temporary user to the list and
 * then fires the real `createUserAtom` mutation in the background.
 *
 * The temporary user receives a negative timestamp-based `id` so it can be
 * distinguished from server-assigned IDs. Once the mutation settles the
 * optimistic result is replaced with the authoritative server response.
 *
 * @example
 * // Inside a React component:
 * const [run] = useAtom(createUserOptimisticAtom);
 * run({ name: "Jane", username: "jane", email: "jane@example.com", language: "en" });
 */
export const createUserOptimisticAtom = Atom.optimisticFn(
  optimisticGetUsersAtom,
  {
    reducer: (currentResult, formValues) =>
      AsyncResult.map(currentResult, (currentUsers) => [
        ...currentUsers,
        createTempUser(formValues),
      ]),
    fn: createUserAtom,
  },
);

/**
 * Reactive atom backed by the `FilterRef` `SubscriptionRef`.
 *
 * This atom streams the current filter query value held in `FilterRef`.
 * It automatically re-renders subscribed components whenever the ref is
 * updated — whether by the user typing in `UserFilter` or by the AI
 * `CommandService` `show_users` tool handler.
 *
 * `UserFilter` reads this atom and syncs its value into the `nuqs` URL
 * query param to keep the URL in sync with any AI-driven filter changes.
 */
export const filterRefAtom = runtimeAtom.atom(
  (_get) =>
    Stream.unwrap(
      Effect.gen(function* () {
        const ref = yield* Effect.service(FilterRef);
        return SubscriptionRef.changes(ref);
      }),
    ),
  { initialValue: "" },
);
