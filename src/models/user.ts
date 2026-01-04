import { Schema } from 'effect';
import { languageValues } from './language';

const Name = Schema.String.pipe(
  Schema.minLength(1, { message: () => 'Name is required' }),
  Schema.maxLength(50, {
    message: () => 'Name can max be 50 characters',
  })
);

const Username = Schema.String.pipe(
  Schema.minLength(1, { message: () => 'Username is required' }),
  Schema.maxLength(50, {
    message: () => 'Username can max be 50 characters',
  })
);

const Email = Schema.String.pipe(
  Schema.pattern(
    /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/,
    { message: () => 'Invalid email address' }
  )
);

const Language = Schema.String.pipe(
  Schema.filter((value) =>
    languageValues.includes(value) ? undefined : 'Select a language'
  )
);

const User = Schema.Struct({
  id: Schema.Number,
  name: Name,
  username: Username,
  email: Email,
  language: Schema.optional(Language),
});

const UserForm = Schema.Struct({
  name: Name,
  username: Username,
  email: Email,
  language: Language,
});

export { User, UserForm };
