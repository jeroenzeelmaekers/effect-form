import { Atom, Result } from "@effect-atom/atom";

import { User, UserForm, UserId } from "@/domains/user/model";
import { UserService } from "@/domains/user/service";
import { runtimeAtom } from "@/infrastructure/runtime";

export const getUsersAtom = runtimeAtom
  .atom(UserService.getUsers())
  .pipe(Atom.withReactivity({ users: ["users"] }));

export const createUserAtom = runtimeAtom.fn(UserService.createUser, {
  reactivityKeys: { users: ["users"] },
});

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
      Result.map(currentResult, (currentUsers) => [
        ...currentUsers,
        createTempUser(formValues),
      ]),
    fn: createUserAtom,
  },
);
