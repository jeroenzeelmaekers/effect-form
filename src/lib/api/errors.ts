import { Data, Schema } from 'effect';

export class NetworkError extends Data.TaggedError('NetworkError')<{
  readonly message: string;
}> {}

export class UsersNotFound extends Data.TaggedError('UserNotFound')<{
  readonly message: string;
}> {}

export class ValidationError extends Data.TaggedError('ValidationError')<{
  readonly message: string;
}> {}

export const ProblemDetail = Schema.Struct({
  type: Schema.optional(Schema.String),
  title: Schema.optional(Schema.String),
  status: Schema.optional(Schema.Number),
  detail: Schema.optional(Schema.String),
  instance: Schema.optional(Schema.String),
});
