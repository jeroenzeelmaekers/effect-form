import { Schema } from "effect";

import { languageValues } from "@/domains/language/model";

// Branded UserId type for type safety
export const UserId = Schema.Number.pipe(Schema.brand("UserId"));
export type UserId = typeof UserId.Type;

const Name = Schema.String.check(
  Schema.isMinLength(1, { message: "Name is required" }),
  Schema.isMaxLength(50, {
    message: "Name can max be 50 characters",
  }),
);

const Username = Schema.String.check(
  Schema.isMinLength(1, { message: "Username is required" }),
  Schema.isMaxLength(50, {
    message: "Username can max be 50 characters",
  }),
);
/* oxlint-disable */
const Email = Schema.String.check(
  Schema.isPattern(
    /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/,
    {
      message: "Invalid email address",
    },
  ),
);

const Language = Schema.String.check(
  Schema.makeFilter<string>(
    (value) =>
      languageValues.includes(value) ? undefined : "Select a language",
  ),
);

// Using Schema.Class with tagDefaultOmit for external API decode compatibility
class User extends Schema.Class<User>("User")({
  _tag: Schema.tagDefaultOmit("User"),
  id: UserId,
  name: Name,
  username: Username,
  email: Email,
  language: Schema.optional(Language),
}) {}

class UserForm extends Schema.Class<UserForm>("UserForm")({
  _tag: Schema.tagDefaultOmit("UserForm"),
  name: Name,
  username: Username,
  email: Email,
  language: Language,
}) {}

export { User, UserForm };
