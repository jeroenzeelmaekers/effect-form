import { Data } from 'effect';

export class NetworkError extends Data.TaggedError('NetworkError')<{
  readonly message: string;
}> {}

export class UsersNotFound extends Data.TaggedError('UserNotFound')<{
  readonly message: string;
}> {}

export class ValidationError extends Data.TaggedError('ValidationError')<{
  readonly message: string;
}> {}
