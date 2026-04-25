import { describe, expect, it } from "vitest";

import {
  applyFilter,
  parseFilterQuery,
  serializeTokens,
  tokenize,
} from "@/domains/user/filter";
import type { User } from "@/domains/user/model";
import type { UserId } from "@/domains/user/model";

const makeUser = (
  overrides: Omit<Partial<Omit<User, "_tag">>, "id"> & { id: number },
): User => ({
  _tag: "User",
  id: overrides.id as UserId,
  name: overrides.name ?? "Test User",
  username: overrides.username ?? "testuser",
  email: overrides.email ?? "test@example.com",
  language: overrides.language ?? "en",
});

const john = makeUser({
  id: 1,
  name: "John Doe",
  username: "johndoe",
  email: "john@gmail.com",
});

const jane = makeUser({
  id: 2,
  name: "Jane Smith",
  username: "janesmith",
  email: "jane@outlook.com",
});

const alice = makeUser({
  id: 3,
  name: "Alice Wonder",
  username: "alicew",
  email: "alice@gmail.com",
});

const users = [john, jane, alice];

describe("tokenize", () => {
  it("returns an empty array for an empty string", () => {
    expect(tokenize("")).toEqual([]);
  });

  it("returns an empty array for whitespace-only input", () => {
    expect(tokenize("   ")).toEqual([]);
  });

  it("tokenizes a single text term", () => {
    expect(tokenize("john")).toEqual([{ kind: "text", value: "john" }]);
  });

  it("tokenizes a field:value token", () => {
    expect(tokenize("name:john")).toEqual([
      { kind: "field", field: "name", value: "john" },
    ]);
  });

  it("normalizes field keys to lowercase", () => {
    expect(tokenize("NAME:John")).toEqual([
      { kind: "field", field: "name", value: "John" },
    ]);
  });

  it("tokenizes the AND operator (case-insensitive)", () => {
    expect(tokenize("AND")).toEqual([{ kind: "op", op: "AND" }]);
    expect(tokenize("and")).toEqual([{ kind: "op", op: "AND" }]);
  });

  it("tokenizes the OR operator (case-insensitive)", () => {
    expect(tokenize("OR")).toEqual([{ kind: "op", op: "OR" }]);
    expect(tokenize("or")).toEqual([{ kind: "op", op: "OR" }]);
  });

  it("tokenizes standalone parens", () => {
    expect(tokenize("(")).toEqual([{ kind: "lparen" }]);
    expect(tokenize(")")).toEqual([{ kind: "rparen" }]);
  });

  it("splits attached parens from a token", () => {
    expect(tokenize("(name:john)")).toEqual([
      { kind: "lparen" },
      { kind: "field", field: "name", value: "john" },
      { kind: "rparen" },
    ]);
  });

  it("tokenizes multiple text terms", () => {
    expect(tokenize("john doe")).toEqual([
      { kind: "text", value: "john" },
      { kind: "text", value: "doe" },
    ]);
  });

  it("tokenizes a complex query", () => {
    expect(tokenize("name:john AND email:*@gmail.com")).toEqual([
      { kind: "field", field: "name", value: "john" },
      { kind: "op", op: "AND" },
      { kind: "field", field: "email", value: "*@gmail.com" },
    ]);
  });
});

describe("parseFilterQuery", () => {
  it("returns null for an empty string", () => {
    expect(parseFilterQuery("")).toBeNull();
  });

  it("returns null for whitespace-only input", () => {
    expect(parseFilterQuery("   ")).toBeNull();
  });

  it("parses a single text term", () => {
    expect(parseFilterQuery("john")).toEqual({ kind: "text", value: "john" });
  });

  it("parses a single field token", () => {
    expect(parseFilterQuery("name:john")).toEqual({
      kind: "field",
      field: "name",
      value: "john",
    });
  });

  it("implicitly ANDs adjacent terms", () => {
    expect(parseFilterQuery("john doe")).toEqual({
      kind: "and",
      left: { kind: "text", value: "john" },
      right: { kind: "text", value: "doe" },
    });
  });

  it("parses an explicit AND", () => {
    expect(parseFilterQuery("john AND doe")).toEqual({
      kind: "and",
      left: { kind: "text", value: "john" },
      right: { kind: "text", value: "doe" },
    });
  });

  it("parses an explicit OR", () => {
    expect(parseFilterQuery("john OR doe")).toEqual({
      kind: "or",
      left: { kind: "text", value: "john" },
      right: { kind: "text", value: "doe" },
    });
  });

  it("AND binds tighter than OR", () => {
    expect(parseFilterQuery("a OR b AND c")).toEqual({
      kind: "or",
      left: { kind: "text", value: "a" },
      right: {
        kind: "and",
        left: { kind: "text", value: "b" },
        right: { kind: "text", value: "c" },
      },
    });
  });

  it("parentheses override operator precedence", () => {
    expect(parseFilterQuery("(a OR b) AND c")).toEqual({
      kind: "and",
      left: {
        kind: "or",
        left: { kind: "text", value: "a" },
        right: { kind: "text", value: "b" },
      },
      right: { kind: "text", value: "c" },
    });
  });
});

describe("applyFilter", () => {
  it("returns all users unchanged when ast is null", () => {
    expect(applyFilter(users, null)).toEqual(users);
  });

  it("returns an empty array when users list is empty", () => {
    const ast = parseFilterQuery("john");
    expect(applyFilter([], ast)).toEqual([]);
  });

  it("filters by field substring match (case-insensitive)", () => {
    const ast = parseFilterQuery("name:john");
    expect(applyFilter(users, ast)).toEqual([john]);
  });

  it("filters by field substring (case-insensitive)", () => {
    const ast = parseFilterQuery("name:John");
    expect(applyFilter(users, ast)).toEqual([john]);
  });

  it("filters by field substring match", () => {
    const ast = parseFilterQuery("username:jan");
    expect(applyFilter(users, ast)).toEqual([jane]);
  });

  it("filters by glob wildcard on a field", () => {
    const ast = parseFilterQuery("email:*@gmail.com");
    expect(applyFilter(users, ast)).toEqual([john, alice]);
  });

  it("matches free text against name", () => {
    const ast = parseFilterQuery("Doe");
    expect(applyFilter(users, ast)).toEqual([john]);
  });

  it("matches free text against username", () => {
    const ast = parseFilterQuery("alicew");
    expect(applyFilter(users, ast)).toEqual([alice]);
  });

  it("matches free text against email", () => {
    const ast = parseFilterQuery("outlook");
    expect(applyFilter(users, ast)).toEqual([jane]);
  });

  it("matches free text with a glob across all fields", () => {
    const ast = parseFilterQuery("jane*");
    expect(applyFilter(users, ast)).toEqual([jane]);
  });

  it("applies OR to include users matching either condition", () => {
    const ast = parseFilterQuery("name:John OR name:Jane");
    expect(applyFilter(users, ast)).toEqual([john, jane]);
  });

  it("applies AND to require both conditions", () => {
    const ast = parseFilterQuery("name:John AND email:*@gmail.com");
    expect(applyFilter(users, ast)).toEqual([john]);
  });

  it("applies AND to exclude users that only match one condition", () => {
    const ast = parseFilterQuery("name:John AND email:*@outlook.com");
    expect(applyFilter(users, ast)).toEqual([]);
  });

  it("returns an empty array when no users match", () => {
    const ast = parseFilterQuery("name:nobody");
    expect(applyFilter(users, ast)).toEqual([]);
  });
});

describe("serializeTokens", () => {
  it("returns an empty string for an empty token array", () => {
    expect(serializeTokens([])).toBe("");
  });

  it("serializes a text token", () => {
    expect(serializeTokens([{ kind: "text", value: "john" }])).toBe("john");
  });

  it("serializes a field token", () => {
    expect(
      serializeTokens([{ kind: "field", field: "name", value: "john" }]),
    ).toBe("name:john");
  });

  it("serializes an operator token", () => {
    expect(serializeTokens([{ kind: "op", op: "AND" }])).toBe("AND");
    expect(serializeTokens([{ kind: "op", op: "OR" }])).toBe("OR");
  });

  it("serializes paren tokens", () => {
    expect(
      serializeTokens([
        { kind: "lparen" },
        { kind: "field", field: "name", value: "john" },
        { kind: "rparen" },
      ]),
    ).toBe("( name:john )");
  });

  it("round-trips a complex query through tokenize then serializeTokens", () => {
    const query = "( name:john AND email:*@gmail.com ) OR name:jane";
    expect(serializeTokens(tokenize(query))).toBe(query);
  });
});
