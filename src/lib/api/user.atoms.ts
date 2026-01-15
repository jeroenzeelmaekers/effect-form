import { User, UserForm, UserId } from '@/models/user';
import { Atom, Result } from '@effect-atom/atom';
import { Schema } from 'effect';
import { runtimeAtom } from '../runtime';
import { UserService } from './user.service';

export const getUsersAtom = runtimeAtom
  .atom(UserService.getUsers())
  .pipe(Atom.withReactivity({ users: ['users'] }));

export const createUserAtom = runtimeAtom.fn(UserService.createUser, {
  reactivityKeys: { users: ['users'] },
});

// Optimistic updates

export const optimisticGetUsersAtom = Atom.optimistic(getUsersAtom);

const createTempUser = (
  formValues: Schema.Schema.Type<typeof UserForm>,
): User =>
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
