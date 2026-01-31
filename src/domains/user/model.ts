import type { ColumnDef } from '@tanstack/react-table';
import { Schema } from 'effect';
import { languageValues } from '@/domains/language/model';

// Branded UserId type for type safety
export const UserId = Schema.Number.pipe(Schema.brand('UserId'));
export type UserId = typeof UserId.Type;

const Name = Schema.String.pipe(
  Schema.minLength(1, { message: () => 'Name is required' }),
  Schema.maxLength(50, {
    message: () => 'Name can max be 50 characters',
  }),
);

const Username = Schema.String.pipe(
  Schema.minLength(1, { message: () => 'Username is required' }),
  Schema.maxLength(50, {
    message: () => 'Username can max be 50 characters',
  }),
);
/* oxlint-disable */
const Email = Schema.String.pipe(
  Schema.pattern(
    /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/,
    {
      message: () => 'Invalid email address',
    },
  ),
);

const Language = Schema.String.pipe(
  Schema.filter((value) =>
    languageValues.includes(value) ? undefined : 'Select a language',
  ),
);

// Using Schema.Class for domain entity
class User extends Schema.Class<User>('User')({
  id: UserId,
  name: Name,
  username: Username,
  email: Email,
  language: Schema.optional(Language),
}) {}

const UserColumns: ColumnDef<User>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'username',
    header: 'Username',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
];

class UserForm extends Schema.Class<UserForm>('UserForm')({
  name: Name,
  username: Username,
  email: Email,
  language: Language,
}) {}

export { User, UserColumns, UserForm };
