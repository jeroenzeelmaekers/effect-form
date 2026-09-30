# Services, Layers, And Modules

Use this when defining service tags, module surfaces, layer implementations, runtime wiring, typed errors, or `Effect.fn` operation boundaries.

## Module Surface

Follow the service style already used by the application. In this repository, define a named `Context.Service` class with a static `layer`, use an explicit interface, and export the class directly. Effect does not require a namespace projection.

```ts
export interface UserRepoInterface {
  readonly get: Effect.Effect<User, NotFound | PersistenceError>;
  readonly find: (
    id: UserId,
  ) => Effect.Effect<User, NotFound | PersistenceError>;
}

declare const loadUser: Effect.Effect<User, NotFound | PersistenceError>;
declare const loadUserForId: (
  id: UserId,
) => Effect.Effect<User, NotFound | PersistenceError>;

export class UserRepo extends Context.Service<
  UserRepo,
  UserRepoInterface
>()("@app/UserRepo") {
  static readonly layer = Layer.sync(
    this,
    () => {
      const get = loadUser.pipe(Effect.withSpan("UserRepo.get"));
      const find = Effect.fn("UserRepo.find")(function* (id: UserId) {
        return yield* loadUserForId(id);
      });

      return UserRepo.of({ get, find });
    },
  );
}

export class NotFound extends Schema.TaggedError<NotFound>()(
  "UserRepo.NotFound",
  { id: UserId },
) {}
```

Consumers yield the service and use its operations. Zero-argument operations are Effects; operations with inputs are functions that return Effects.

```ts
import { UserRepo } from "./user-repo.js";

const program = Effect.gen(function* () {
  const repo = yield* UserRepo;
  return yield* repo.find(id);
});
```

For a zero-argument operation, expose an Effect-valued property such as `readonly get: Effect.Effect<User, NotFound | PersistenceError>`. Build it as an Effect value, and use `Effect.withSpan(...)` if it needs tracing. Use `Effect.fn("UserRepo.find")` for an operation with arguments.

Some codebases prefer a file-local role name and a canonical ES module namespace projection. Use that only if it is already the established project convention. It is not required by Effect and is not the style used by this repository.

Guidance:

- Export only intentional surface; keep local schemas, row codecs, helpers, and implementation details unexported.
- Do not introduce TypeScript `namespace` declarations for organization.
- This repository's lint rule rejects relative runtime imports whose named export matches `make[A-Z]`, even if the function is a pure domain constructor. Keep such helpers local or use a domain-specific name that does not match the rule. Test and spec files are exempt. This is a syntactic restriction, not a check that the function constructs a service.

## Layer Constructors

Choose the layer constructor that matches the thing produced.

```ts
Layer.succeed(Service, impl); // already-built service
Layer.sync(Service, () => impl); // lazy synchronous service
Layer.effect(Service, makeEffect); // effectful service acquisition
```

Guidance:

- Use `Layer.effect(Service, Effect.gen(...))` when constructing the service requires Effects or other services. Use `Layer.sync(...)` or `Layer.succeed(...)` when construction is synchronous.
- Use `Layer.effectContext(...)` when one acquisition intentionally supplies multiple services, especially first-class test stubs or one client backing several service tags.
- Use `Layer.unwrap(...)` when config or runtime discovery chooses/builds the layer.
- Use `Layer.fresh(...)` or `Effect.provide(layer, { local: true })` only when a test or operation needs isolated acquisition.
- Use `Context.Reference` rarely, only for ambient/defaultable runtime references where a safe default is real.

## Long-Lived Work

A layer that starts a stream, listener, worker, subscription, or forever loop must fork that work into the layer scope. Layer acquisition must complete.

```ts
export const layer = Layer.effectDiscard(
  Effect.gen(function* () {
    const events = yield* Events.Service;

    yield* events.stream.pipe(
      Stream.runForEach(handleEvent),
      Effect.forkScoped,
    );
  }),
);
```

Guidance:

- Use `Effect.forkScoped`, `FiberSet`, or `FiberMap` for scoped background work.
- Do not run forever work inline during layer acquisition.
- Do not expose public `start` methods unless the domain explicitly needs manual lifecycle control.

## Runtime Wiring

- Use `Layer.provide(...)` to hide an implementation dependency.
- Use `Layer.provideMerge(...)` only when the dependency should remain exposed for downstream consumers.
- Use `Layer.mergeAll(...)` for independent exposed layers.
- Prefer flat, topologically sorted runtime layer values with named subgraphs.
- Avoid using `provideMerge` as a blind make-it-compile tool.
- Avoid hiding important authority or lifecycle dependencies behind broad invisible provisioning.

## Effect.fn

Use extra `Effect.fn(...)` arguments for wrappers that apply to the whole function call. Each transform receives `(effect, ...originalArgs)`.

```ts
const readAttachment = Effect.fn("Attachment.read")(
  function* (ref: AttachmentRef) {
    return yield* api.read(ref);
  },
  (effect, ref) =>
    effect.pipe(attachmentError("Attachment.read", { attachmentId: ref.id })),
);
```

Good whole-function transforms:

- error classification
- localized recovery
- logging annotations
- spans
- retry
- timeout
- ensuring cleanup
- small local provisioning
- result mapping

Guidance:

- Keep the generator body focused on the core workflow.
- Use transforms when the wrapper needs original arguments.
- Do not build long clever pipelines; one or two transforms is usually enough.
- Do not use this for local branch-level handling inside the workflow.

## Operation Error Helpers

For boundary errors with operation labels, prefer a shared curried `mapError` helper over hand-writing wrappers in every module.

```ts
const persistenceError = operationError(PersistenceError.make);

const row = yield * query.pipe(persistenceError("UserRepository.findById"));
```

Name the local helper after the error it produces, such as `persistenceError`, `projectionError`, or `processingError`. Use `Effect.fn(...)` and spans for observability in addition to payload labels, not instead of them.
