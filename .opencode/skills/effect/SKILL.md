---
name: effect
description: |
  Opinionated guide for building production TypeScript applications with Effect v4. Use when implementing Effect workflows, services, layers, schemas, configuration, schedules, caches, streams, HTTP clients, or tests.
license: MIT
compatibility: Requires Effect v4. Examples are reviewed against the version documented in this repository.
---

# Effect

Use current Effect v4 APIs and the production defaults in this skill. Established project conventions still take precedence unless the task is explicitly changing them.

## Source Rule

Check these before guessing:

- the nearest `AGENTS.md` and any project-local Effect practices doc
- the project-pinned `effect` package source and version
- current upstream Effect source when the installed package does not answer the question

This repository pins `effect@4.0.0-rc.118`. Treat that package's exports and source as authoritative for examples. Do not assume an API described as “Effect v4” matches this release.

## Branch Chooser

Read only the branch references that match the task.

- Data models, schemas, brands, variants, optional keys, or decoders: read `references/SCHEMA.md`.
- Services, module surfaces, layers, runtime wiring, errors, `Effect.fn`, or test services: read `references/SERVICES_LAYERS.md`.
- Runtime config, env variables, `ConfigProvider`, or `layerConfig`: read `references/CONFIG.md`.
- Retry, repeat, polling, backoff, jitter, rate-limit-aware policies, or pass loops: read `references/SCHEDULING.md`.
- Memoization, per-key TTL caches, deduplicating concurrent lookups, or request batching: read `references/CACHING.md`.
- Streams, event sources, async iterables, queues/pubsubs, pagination, backpressure, or stream consumers: read `references/STREAMS.md`.
- Outgoing HTTP calls, Effect HttpClient, status handling, or HTTP rate limiting: read `references/HTTP_CLIENTS.md`.
- Effect tests, time, sleeps, concurrency synchronization, or fakes: read `references/TESTING.md`.

If a task spans several branches, read all matching files before editing.

## Core Defaults

- Compose workflows with `Effect.gen(function* () { ... })`.
- Define public service methods and non-trivial internal service methods with `Effect.fn("Domain.operation")`.
- Use `Effect.fnUntraced` only for internal helpers where stack-frame/span metadata is intentionally unnecessary.
- Prefer `Context.Service` for application services when the codebase has not standardized on another current service-tag style.
- Build real service implementations with `Layer.effect(Service, Effect.gen(...))` and return `Service.of({ ... })`.
- Model records with `Schema.Struct(...)` plus a same-name `interface`.
- Model typed Effect errors with `Schema.TaggedError`.
- Read runtime config through `Config`, not direct `process.env` access in application logic. In this repository, use the pinned API names such as `Config.String`, `Config.Boolean`, and `Config.Redacted`.
- Use `Schedule` for retry, repeat, polling, pacing, and backoff policies.
- Use `Stream` for effectful sources that emit many values over time and need pull, backpressure, interruption, or transformation.
- Prefer Effect HTTP client modules for outgoing HTTP in Effect applications when their typed errors, layers, and client transforms are useful.
- Prefer Effect-aware tests, explicit layers, and deterministic synchronization over sleeps.
- Prefer decoders and `schema.makeEffect(...)` at untrusted boundaries; reserve throwing `schema.make(...)` for trusted construction, and never use casts to skip validation.

## Quick Selection Guide

- Ordinary object record: `Schema.Struct(...)` plus same-name `interface`.
- Scalar ID/value object: constrained branded schema.
- Internal workflow decision or state: `Data.TaggedEnum<...>` plus `Data.taggedEnum<...>()` constructors and exhaustive `$match`.
- Reusable boundary-crossing tagged variant: `Schema.TaggedStruct(...)` plus same-name `interface`.
- Boundary-crossing tagged union: `Schema.TaggedUnion(...)` with `.cases`, `.guards`, and `.match`.
- External/custom discriminator such as `type`: `Schema.Struct({ type: Schema.tag("variant"), ... })` plus `Schema.toTaggedUnion("type")` when union helpers are needed.
- Expected typed failure: `Schema.TaggedError`.
- Unknown boundary payload: `Schema.decodeUnknownEffect(...)`.
- Service boundary: `Context.Service<Service, Interface>()(...)` plus `Layer.effect(...)` plus `Service.of(...)`.
- Public or non-trivial internal service method: `Effect.fn("Domain.operation")`.
- Runtime configuration: `Config` recipes read in layers; override with `ConfigProvider` in tests.
- Event source: `Stream` consumed with `Stream.runForEach(...)` and forked with `Effect.forkScoped` in the owning layer.
- Queue-backed event source: `Queue` for the producer boundary, `Stream.fromQueue(...)` for consumers.
- Broadcast event source: `PubSub` / `Stream.fromPubSub(...)` or `SubscriptionRef` for latest-value state.
- Polling worker: `runPass().pipe(Effect.repeat(Schedule.spaced(...)))`, with typed pass failures handled before repeat.
- Retry transient operation: `Effect.retry(...)` / `Effect.retryOrElse(...)` with a bounded `Schedule`.
- Keyed lookup cache with TTL and concurrent-lookup dedupe: prefer `Cache.make(...)` / exit-aware `Cache.makeWith(...)` when their lifecycle and eviction model fit.
- Memoize a single effect result: `Effect.cached(...)` / `Effect.cachedWithTTL(...)`.
- Batch N keys into one backend call (only when a real batch endpoint exists): `Effect.request(...)` + `RequestResolver`.
- HTTP request in an Effect application: prefer Effect `HttpClient` plus request/response schema decoding.
- HTTP transient retry: `HttpClient.retryTransient(...)`.
- Time-sensitive test: `TestClock`, not real sleeping.
- Concurrent/background test synchronization: `Deferred`, `Queue`, `Latch`, `Ref`, or explicit test hooks.

## Project lint constraints

Lint is not a substitute for the Effect skill. Follow these additional constraints when editing this repository:

- Decode an `unknown` value directly at its I/O boundary. `anti-slop/no-unknown-parameters` also rejects helper parameters typed `unknown`, including legitimate decoder helpers, unless the parameter is named `cause` or is a type-predicate subject. Keep boundary decoding inline until that rule is narrowed.
- `anti-slop-effect/no-service-constructor-imports` rejects relative named imports matching `make[A-Z]` from runtime files, even when the imported function is a pure value constructor. Keep such helpers local or choose a domain-specific name that does not match the rule. Test and spec files are exempt.
- Avoid module-level test mocking. The configured rule catches `vi`/`jest` mocking imported from `vitest` or `@jest/globals`, but currently misses the repository's `vite-plus/test` entrypoint. A passing lint run does not make such mocks compliant with the intended dependency-injection policy.
- `anti-slop/no-runtime-typeof` rejects runtime `typeof` checks, including ordinary type guards. Prefer Schema decoding at boundaries and Effect `Predicate` helpers for reusable runtime predicates.
- `anti-slop/no-shape-in-symbol-names` rejects the case-insensitive substring `shape` in declared symbol names. It can reject legitimate domain names as well as generic structural names.
- Use specific domain types in function parameters and return types. The custom rules reject broad `object` inputs, `unknown` returns and aliases, and dictionary value contracts that use `unknown`, `any`, `object`, or `{}`.
- Preserve precise inferred types. The custom rules reject widening known values to broad types before narrowing them with assertions, chained assertions, and copying a growing reducer accumulator. They also flag adjacent eager array `filter`/`map` passes and conditional spreads of `{}`.
- Avoid `Reflect.get` and `Reflect.apply`; use typed property access, a normal typed call, or a named interface.
- The tagged-value rules are syntax-based. Do not hand-build `_tag` values where an Effect constructor exists. Raw external payloads and malformed fixtures may need a narrow rule suppression; lint does not infer whether a constructor exists.
- Every non-`const` type assertion needs a nearby `SAFETY:` comment under lint. This is only a lint requirement; it does not make an unsafe assertion acceptable. Prefer decoding and inferred types instead.
- Keep examples formatted with the repository's Oxfmt style and readable-spacing lint rules. The skill directory itself is excluded from lint and formatting, so examples are not checked automatically.

## Boundary Rules

- Keep HTTP handlers thin: decode input, read context, call services, map typed errors to transport responses.
- Keep business rules in services or domain functions, not transport handlers.
- Wrap HTTP clients, SDKs, CLIs, and external integrations in named effects at adapter boundaries.
- Decode persisted rows with Schema or SQL-specific helpers when values are not trivially trusted.
- Keep provider/network calls outside authoritative database transactions.
- Catch or retry only when the current boundary has a truthful response.
- Retry only when the operation has proven idempotency.
- Let exhausted failures remain visible unless the boundary has a real fallback.

## Do Nots

- Do not use `as any`, non-null assertions, or unchecked casts to silence Effect typing problems.
- Do not introduce `Schema.Class` or `Schema.TaggedClass` as default app data-modeling patterns.
- Do not hand-roll `_tag` error classes when `Schema.TaggedError` fits.
- Do not use cause-level recovery when typed-error recovery is enough.
- Do not use `Layer.mergeAll(...)` or `provideMerge(...)` as blind make-it-compile tools.
- Do not hide required application authority, credentials, persistence, transports, or external services behind `Context.Reference` defaults.
- Do not add arbitrary `Effect.sleep(...)` to tests when a deterministic synchronization primitive is available.
- Do not hand-roll Map/TTL/prune caches or in-flight dedupe when `effect/Cache` fits.
