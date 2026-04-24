import { Schema } from "effect";

import { languageValues } from "@/domains/language/model";

/**
 * Branded numeric schema for user identifiers.
 * Encodes a plain `number` and brands it as `"UserId"` to prevent accidental
 * mix-ups with other numeric IDs at the type level.
 *
 * @example
 * const id = Schema.decodeSync(UserId)(42); // UserId (branded number)
 */
export const UserId = Schema.Number.pipe(Schema.brand("UserId"));

/** TypeScript type for a branded user ID value. */
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
  Schema.makeFilter<string>((value) =>
    languageValues.includes(value) ? undefined : "Select a language",
  ),
);

/**
 * Effect Schema class representing a user as returned by the API.
 *
 * Decodes JSON objects from the JSONPlaceholder `/users` endpoint into
 * strongly-typed, validated `User` instances. The `_tag` field is omitted
 * from the encoded form so the class is compatible with the external API shape.
 *
 * Fields:
 * - `id` — branded `UserId` number.
 * - `name` — 1–50 character display name.
 * - `username` — 1–50 character username.
 * - `email` — RFC-compliant e-mail address.
 * - `language` — optional language code validated against `languageValues`.
 */
class User extends Schema.Class<User>("User")({
  _tag: Schema.tagDefaultOmit("User"),
  id: UserId,
  name: Name,
  username: Username,
  email: Email,
  language: Schema.optional(Language),
}) {}

/**
 * Effect Schema class representing the user creation / edit form payload.
 *
 * Similar to `User` but without an `id` field, and with `language` as a
 * required (non-optional) field. Used to validate form values before they
 * are submitted to the API.
 *
 * Fields:
 * - `name` — 1–50 character display name.
 * - `username` — 1–50 character username.
 * - `email` — RFC-compliant e-mail address.
 * - `language` — required language code validated against `languageValues`.
 */
class UserForm extends Schema.Class<UserForm>("UserForm")({
  _tag: Schema.tagDefaultOmit("UserForm"),
  name: Name,
  username: Username,
  email: Email,
  language: Language,
}) {}

export { User, UserForm };
