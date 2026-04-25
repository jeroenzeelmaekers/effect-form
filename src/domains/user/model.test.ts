import { Schema } from "effect";
import { describe, expect, it } from "vitest";

import { User, UserForm, UserId } from "./model";

describe("UserId", () => {
  it("should decode a valid number into a branded UserId", () => {
    const id = Schema.decodeSync(UserId)(42);
    expect(id).toBe(42);
  });

  it("should fail to decode a non-number", () => {
    expect(() =>
      Schema.decodeSync(UserId)("not-a-number" as unknown as number),
    ).toThrow();
  });
});

describe("User schema", () => {
  const validUser = {
    id: 1,
    name: "John Doe",
    username: "johndoe",
    email: "john@example.com",
  };

  it("should decode a valid user object", () => {
    const user = Schema.decodeSync(User)(validUser);
    expect(user._tag).toBe("User");
    expect(user.id).toBe(1);
    expect(user.name).toBe("John Doe");
    expect(user.username).toBe("johndoe");
    expect(user.email).toBe("john@example.com");
    expect(user.language).toBeUndefined();
  });

  it("should decode a user with an optional language field", () => {
    const user = Schema.decodeSync(User)({ ...validUser, language: "en" });
    expect(user.language).toBe("en");
  });

  it.each([
    ["name", { ...validUser, name: "" }],
    ["username", { ...validUser, username: "" }],
    ["email", { ...validUser, email: "not-an-email" }],
    ["language", { ...validUser, language: "xx" }],
  ])("should fail to decode when %s is invalid", (_, input) => {
    expect(() => Schema.decodeSync(User)(input)).toThrow();
  });

  it("should fail when name exceeds 50 characters", () => {
    expect(() =>
      Schema.decodeSync(User)({ ...validUser, name: "a".repeat(51) }),
    ).toThrow();
  });

  it("should fail when username exceeds 50 characters", () => {
    expect(() =>
      Schema.decodeSync(User)({ ...validUser, username: "a".repeat(51) }),
    ).toThrow();
  });
});

describe("UserForm schema", () => {
  const validForm = {
    name: "John Doe",
    username: "johndoe",
    email: "john@example.com",
    language: "en",
  };

  it("should decode a valid user form object", () => {
    const form = Schema.decodeSync(UserForm)(validForm);
    expect(form._tag).toBe("UserForm");
    expect(form.name).toBe("John Doe");
    expect(form.username).toBe("johndoe");
    expect(form.email).toBe("john@example.com");
    expect(form.language).toBe("en");
  });

  it("should accept all valid language values", () => {
    for (const lang of ["auto", "en", "nl", "fr"]) {
      const form = Schema.decodeSync(UserForm)({
        ...validForm,
        language: lang,
      });
      expect(form.language).toBe(lang);
    }
  });

  it("should fail when language is invalid", () => {
    expect(() =>
      Schema.decodeSync(UserForm)({ ...validForm, language: "de" }),
    ).toThrow();
  });

  it("should fail when required language field is missing", () => {
    const { language: _, ...withoutLanguage } = validForm;
    expect(() =>
      Schema.decodeSync(UserForm)(
        withoutLanguage as unknown as typeof validForm,
      ),
    ).toThrow();
  });

  it.each([
    ["name", { ...validForm, name: "" }],
    ["username", { ...validForm, username: "" }],
    ["email", { ...validForm, email: "bad-email" }],
  ])("should fail to decode when %s is invalid", (_, input) => {
    expect(() => Schema.decodeSync(UserForm)(input)).toThrow();
  });
});
