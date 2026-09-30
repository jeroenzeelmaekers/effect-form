import { Schema } from "effect";
import { describe, expect, it } from "vite-plus/test";

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
      const invalidPost = rest;

      expect(() => Schema.decodeUnknownSync(Post)(invalidPost)).toThrow();
    },
  );

  it("should fail when id is not a number", () => {
    const invalidPost = { ...validPost, id: "not-a-number" };

    expect(() => Schema.decodeUnknownSync(Post)(invalidPost)).toThrow();
  });

  it("should fail when title is not a string", () => {
    const invalidPost = { ...validPost, title: 123 };

    expect(() => Schema.decodeUnknownSync(Post)(invalidPost)).toThrow();
  });
});
