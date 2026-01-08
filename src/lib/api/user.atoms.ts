import { UserForm } from '@/models/user';
import { Atom, Result } from '@effect-atom/atom';
import { Schema } from 'effect';
import { runtimeAtom } from '../runtime';
import { UserService } from './user.service';

export const getUsersAtom = runtimeAtom
  .atom(UserService.getUsers())
  .pipe(Atom.withReactivity({ users: ['users'] }), Atom.withLabel('usersAtom'));

export const createUserFn = runtimeAtom.fn(UserService.createUser, {
  reactivityKeys: { users: ['users'] },
});

// Optimistic updates

export const optimisticGetUsersAtom = Atom.optimistic(getUsersAtom);

const createTempUser = (
  formValues: Schema.Schema.Type<typeof UserForm>
): Schema.Schema.Type<typeof UserForm> & { id: number } => ({
  id: -Date.now(),
  name: formValues.name,
  username: formValues.username,
  email: formValues.email,
  language: formValues.language,
});

export const createUserOptimistic = Atom.optimisticFn(optimisticGetUsersAtom, {
  reducer: (currentResult, formValues) =>
    Result.map(currentResult, (currentUsers) => [
      ...currentUsers,
      createTempUser(formValues),
    ]),
  fn: createUserFn,
});
