import type { User } from "@/domains/user/model";

/**
 * A single token produced by the query tokenizer.
 *
 * - `field`  — a `key:value` pair targeting a specific user field (e.g. `name:john`)
 * - `text`   — a free-text term matched against all searchable fields
 * - `op`     — a boolean operator (`AND` / `OR`) used to combine terms
 * - `lparen` — an opening parenthesis `(` for grouping sub-expressions
 * - `rparen` — a closing parenthesis `)` for grouping sub-expressions
 */
export type RawToken =
  | { kind: "field"; field: FieldKey; value: string }
  | { kind: "text"; value: string }
  | { kind: "op"; op: "AND" | "OR" }
  | { kind: "lparen" }
  | { kind: "rparen" };

/** The set of user fields that can be targeted by a `field:value` filter token. */
export type FieldKey = "name" | "username" | "email";

/** Read-only array of all valid {@link FieldKey} values. */
export const FIELD_KEYS: ReadonlyArray<FieldKey> = [
  "name",
  "username",
  "email",
];

const FIELD_PATTERN = /^(name|username|email):(.+)$/i;
const OP_PATTERN = /^(AND|OR)$/i;

/**
 * The set of `field:` prefix strings accepted by the filter input.
 * Useful for driving autocomplete suggestions.
 */
export const FILTER_FIELD_PREFIXES: ReadonlyArray<`${FieldKey}:`> = [
  "name:",
  "username:",
  "email:",
];

/**
 * Splits a raw query string into a flat list of {@link RawToken}s.
 *
 * Tokens are whitespace-delimited. Each part is classified as:
 * - A grouping paren (`(` or `)`)
 * - An operator (`AND` / `OR`, case-insensitive)
 * - A field filter (`name:value`, `username:value`, `email:value`)
 * - A free-text term (everything else)
 *
 * Parentheses that are directly attached to another token (e.g. `(name:john`)
 * are split out automatically before classification.
 *
 * @param query - The raw filter string entered by the user.
 * @returns An ordered array of tokens.
 *
 * @example
 * tokenize("(name:john AND email:*@gmail.com) OR email:*@outlook.com")
 * // => [
 * //   { kind: "lparen" },
 * //   { kind: "field", field: "name", value: "john" },
 * //   { kind: "op", op: "AND" },
 * //   { kind: "field", field: "email", value: "*@gmail.com" },
 * //   { kind: "rparen" },
 * //   { kind: "op", op: "OR" },
 * //   { kind: "field", field: "email", value: "*@outlook.com" },
 * // ]
 */
export function tokenize(query: string): RawToken[] {
  // Split on whitespace first, then further split each part on parens
  const parts = query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((part) => {
      // Split out leading/trailing parens: e.g. "(name:john)" → ["(", "name:john", ")"]
      const pieces: string[] = [];
      let s = part;
      while (s.startsWith("(")) {
        pieces.push("(");
        s = s.slice(1);
      }
      const tail: string[] = [];
      while (s.endsWith(")")) {
        tail.unshift(")");
        s = s.slice(0, -1);
      }
      if (s) pieces.push(s);
      return [...pieces, ...tail];
    })
    .filter(Boolean);

  return parts.map((part): RawToken => {
    if (part === "(") return { kind: "lparen" };
    if (part === ")") return { kind: "rparen" };
    if (OP_PATTERN.test(part)) {
      return { kind: "op", op: part.toUpperCase() as "AND" | "OR" };
    }
    const match = FIELD_PATTERN.exec(part);
    if (match) {
      return {
        kind: "field",
        field: match[1].toLowerCase() as FieldKey,
        value: match[2],
      };
    }
    return { kind: "text", value: part };
  });
}

/**
 * A node in the parsed filter AST.
 *
 * - `field` — match a specific field against a value pattern
 * - `text`  — match a free-text pattern against all searchable fields
 * - `and`   — both child nodes must match
 * - `or`    — at least one child node must match
 */
export type FilterNode =
  | { kind: "field"; field: FieldKey; value: string }
  | { kind: "text"; value: string }
  | { kind: "and"; left: FilterNode; right: FilterNode }
  | { kind: "or"; left: FilterNode; right: FilterNode };

const PRECEDENCE = { OR: 1, AND: 2 } as const;

/**
 * Recursively parses an operator-precedence expression from `tokens`.
 *
 * @internal
 * **Destructive**: consumes tokens from the array via `shift()`. Always pass
 * a freshly-allocated array (e.g. the result of {@link tokenize}) — never
 * pass a cached or shared token array, as it will be emptied by this call.
 */
function parseExpression(
  tokens: RawToken[],
  minPrec: number,
): FilterNode | null {
  const initial = parsePrimary(tokens);
  if (!initial) return null;

  let left: FilterNode = initial;

  while (tokens.length > 0) {
    const next = tokens[0];

    if (next.kind !== "op") {
      if (PRECEDENCE.AND <= minPrec) break;
      const right = parseExpression(tokens, PRECEDENCE.AND);
      if (!right) break;
      left = { kind: "and", left, right };
      continue;
    }

    const prec = PRECEDENCE[next.op];
    if (prec <= minPrec) break;

    tokens.shift();
    const right = parseExpression(tokens, prec);
    if (!right) break;
    left = {
      kind: next.op === "AND" ? "and" : "or",
      left,
      right,
    };
  }

  return left;
}

function parsePrimary(tokens: RawToken[]): FilterNode | null {
  if (tokens.length === 0) return null;
  const t = tokens[0];

  // Grouped sub-expression: ( <expr> )
  if (t.kind === "lparen") {
    tokens.shift(); // consume "("
    const inner = parseExpression(tokens, 0);
    if (tokens.length > 0 && tokens[0].kind === "rparen") {
      tokens.shift(); // consume ")"
    }
    return inner;
  }

  if (t.kind === "op" || t.kind === "rparen") return null; // not a primary node
  tokens.shift();
  return t.kind === "field"
    ? { kind: "field", field: t.field, value: t.value }
    : { kind: "text", value: t.value };
}

/**
 * Parses a query string into a {@link FilterNode} AST using operator-precedence
 * parsing (`AND` binds tighter than `OR`; adjacent terms are implicitly `AND`ed).
 *
 * @param query - The raw filter string entered by the user.
 * @returns The root AST node, or `null` if the query is empty.
 *
 * @example
 * parseFilterQuery("john OR name:jane")
 * // => { kind: "or", left: { kind: "text", value: "john" }, right: { kind: "field", field: "name", value: "jane" } }
 */
export function parseFilterQuery(query: string): FilterNode | null {
  const tokens = tokenize(query);
  if (tokens.length === 0) return null;
  return parseExpression(tokens, 0);
}

/**
 * Tests whether `pattern` matches `haystack` (case-insensitive).
 *
 * - When `pattern` contains no `*`, performs a substring search.
 * - When `pattern` contains `*`, treats each `*` as a multi-character wildcard
 *   and performs a full-string glob match.
 *
 * @param pattern  - The user-supplied pattern (may include `*` wildcards).
 * @param haystack - The string value to test against.
 * @returns `true` if the pattern matches.
 *
 * @example
 * matchValue("john",        "John Doe")    // true  (substring)
 * matchValue("*@gmail.com", "foo@gmail.com") // true  (glob)
 * matchValue("j*e",         "jane")        // true  (glob)
 */
export function matchValue(pattern: string, haystack: string): boolean {
  const p = pattern.toLowerCase();
  const h = haystack.toLowerCase();

  if (!p.includes("*")) {
    return h.includes(p);
  }

  const regex = new RegExp(
    "^" + p.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$",
  );
  return regex.test(h);
}

function evaluateNode(node: FilterNode, user: User): boolean {
  switch (node.kind) {
    case "field": {
      return matchValue(node.value, user[node.field]);
    }
    case "text": {
      return (
        matchValue(node.value, user.name) ||
        matchValue(node.value, user.username) ||
        matchValue(node.value, user.email)
      );
    }
    case "and":
      return evaluateNode(node.left, user) && evaluateNode(node.right, user);
    case "or":
      return evaluateNode(node.left, user) || evaluateNode(node.right, user);
  }
}

/**
 * Filters an array of {@link User}s against a pre-parsed {@link FilterNode} AST.
 *
 * Returns the original array unchanged when `ast` is `null` (i.e. no active filter).
 *
 * @param users - The full list of users to filter.
 * @param ast   - The parsed filter AST, or `null` to skip filtering.
 * @returns The subset of users that satisfy the filter expression.
 */
export function applyFilter(users: User[], ast: FilterNode | null): User[] {
  if (!ast) return users;
  return users.filter((user) => evaluateNode(ast, user));
}

/**
 * Serializes an array of {@link RawToken}s back into a query string.
 *
 * The inverse of {@link tokenize}: field tokens are formatted as `field:value`,
 * operator tokens as their uppercase keyword, and text tokens as-is, all
 * joined by single spaces.
 *
 * @param tokens - The token array to serialize.
 * @returns The reconstructed query string.
 */
export function serializeTokens(tokens: RawToken[]): string {
  return tokens
    .map((t) =>
      t.kind === "op"
        ? t.op
        : t.kind === "field"
          ? `${t.field}:${t.value}`
          : t.kind === "lparen"
            ? "("
            : t.kind === "rparen"
              ? ")"
              : t.value,
    )
    .join(" ");
}

/**
 * Alias for {@link tokenize}.
 *
 * Splits a query string into its constituent {@link RawToken} segments.
 * Exposed under a semantically distinct name so UI components can import
 * the "render segments" concept without depending on the `tokenize` function
 * name, making it easier to evolve the two use-cases independently in future.
 *
 * @param query - The raw filter string.
 * @returns An ordered array of tokens.
 */
export function queryToSegments(query: string): RawToken[] {
  return tokenize(query);
}
