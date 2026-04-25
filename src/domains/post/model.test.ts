import { Schema } from "effect";
import { describe, expect, it } from "vitest";

import { Post } from "./model";

describe("Post schema", () => {
  const validPost = {
    id: 1,
    title: "My first post",
    body: "Hello, world!",
    userId: 42,
  };

  it("should decode a valid post object", () => {
    const post = Schema.decodeSync(Post)(validPost);
    expect(post.id).toBe(1);
    expect(post.title).toBe("My first post");
    expect(post.body).toBe("Hello, world!");
    expect(post.userId).toBe(42);
  });

  it.each(["id", "title", "body", "userId"] as const)(
    "should fail when required field '%s' is missing",
    (field) => {
      const { [field]: _, ...rest } = validPost;
      expect(() =>
        Schema.decodeSync(Post)(rest as unknown as typeof validPost),
      ).toThrow();
    },
  );

  it("should fail when id is not a number", () => {
    expect(() =>
      Schema.decodeSync(Post)({
        ...validPost,
        id: "not-a-number",
      } as unknown as typeof validPost),
    ).toThrow();
  });

  it("should fail when title is not a string", () => {
    expect(() =>
      Schema.decodeSync(Post)({
        ...validPost,
        title: 123,
      } as unknown as typeof validPost),
    ).toThrow();
  });
});
