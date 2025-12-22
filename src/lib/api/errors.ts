import { Data } from "effect";

export class NetworkError extends Data.TaggedError("NetworkError")<{
  readonly message: string;
}> {}

export class UserNotFound extends Data.TaggedError("UserNotFound")<{
  readonly userId: number;
}> {}

export class ValidationError extends Data.TaggedError("ValidationError")<{
  readonly message: string;
}> {}
