import { Layer } from "effect";
import { Atom } from "effect/unstable/reactivity";

import { getDebugSettingsSync } from "@/domains/debug/service";
import { PostService } from "@/domains/post/service";
import { UserService } from "@/domains/user/service";
import { TelemetryLive } from "@/infrastructure/telemetry";
import { ApiLive } from "@/shared/api/client";

const ServicesLive = Layer.mergeAll(UserService.layer, PostService.layer).pipe(
  Layer.provide(ApiLive),
);

const MainLive = getDebugSettingsSync().otelEnabled
  ? ServicesLive.pipe(Layer.provideMerge(TelemetryLive))
  : ServicesLive;

/**
 * Shared `Atom.runtime` instance backed by the fully-composed application `Layer`.
 *
 * The layer graph includes `UserService`, `PostService`, and `ApiLive`. When
 * the `otelEnabled` debug flag is set in `localStorage`, `TelemetryLive` is
 * merged in so that OTLP tracing and logging are active for the entire runtime.
 *
 * All domain atoms (`getUsersAtom`, `createUserAtom`, etc.) are created from
 * this shared runtime so they share the same service instances and reactivity
 * system.
 *
 * @example
 * // Create a reactive atom that runs inside the shared runtime:
 * export const myAtom = runtimeAtom.atom(
 *   Effect.gen(function* () {
 *     const svc = yield* UserService;
 *     return yield* svc.getUsers();
 *   })
 * );
 */
export const runtimeAtom = Atom.runtime(MainLive);
