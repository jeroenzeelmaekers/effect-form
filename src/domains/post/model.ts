import { Schema } from 'effect';

const Post = Schema.Struct({
  id: Schema.Number,
  title: Schema.String,
  body: Schema.String,
  userId: Schema.Number,
});

export { Post };
