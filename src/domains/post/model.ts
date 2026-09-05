import { Schema } from "effect";

/**
 * Effect Schema struct representing a blog post as returned by the
 * JSONPlaceholder `/posts` endpoint.
 *
 * Fields:
 * - `id` — numeric post identifier assigned by the server.
 * - `title` — post headline string.
 * - `body` — full text content of the post.
 * - `userId` — numeric identifier of the author.
 */
const Post = Schema.Struct({
  id: Schema.Finite,
  title: Schema.String,
  body: Schema.String,
  userId: Schema.Finite,
});

export { Post };
