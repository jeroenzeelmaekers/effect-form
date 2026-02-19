import { Effect, Schema } from "effect";
import { Atom, AsyncResult } from "effect/unstable/reactivity";

import { User, UserForm, UserId } from "@/domains/user/model";
import { UserService } from "@/domains/user/service";
import { runtimeAtom } from "@/infrastructure/runtime";

export const getUsersAtom = runtimeAtom
  .atom(
    Effect.gen(function* () {
      const svc = yield* UserService;
      return yield* svc.getUsers();
    }),
  )
  .pipe(Atom.withReactivity({ users: ["users"] }));

export const createUserAtom = runtimeAtom.fn(
  (formValues: Schema.Schema.Type<typeof UserForm>) =>
    Effect.gen(function* () {
      const svc = yield* UserService;
      return yield* svc.createUser(formValues);
    }),
  {
    reactivityKeys: { users: ["users"] },
  },
);

// Optimistic updates

export const optimisticGetUsersAtom = Atom.optimistic(getUsersAtom);

const createTempUser = (formValues: UserForm): User =>
  new User({
    id: -Date.now() as UserId,
    name: formValues.name,
    username: formValues.username,
    email: formValues.email,
    language: formValues.language,
  });

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
