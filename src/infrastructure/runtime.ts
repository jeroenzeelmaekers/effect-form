import { Layer } from "effect";
import { Atom } from "effect/unstable/reactivity";

import { CommandService } from "@/domains/search/command-service";
import { NavigationService } from "@/domains/search/navigation-service";
import { getDebugSettingsSync } from "@/domains/debug/service";
import { PostService } from "@/domains/post/service";
import { FilterRef } from "@/domains/user/filter-ref";
import { UserService } from "@/domains/user/service";
import { TelemetryLive } from "@/infrastructure/telemetry";
import { ApiLive } from "@/shared/api/client";

const SharedServicesLive = Layer.mergeAll(
  UserService.layer,
  PostService.layer,
  FilterRef.layer,
  NavigationService.layer,
);

// Provide the shared services to CommandService, then merge the result back
// with SharedServicesLive using provideMerge so shared instances are
// constructed exactly once and reused everywhere.
const ServicesLive = CommandService.layer.pipe(
  Layer.provide(SharedServicesLive),
  Layer.provideMerge(SharedServicesLive),
  Layer.provide(ApiLive),
);

const MainLive = getDebugSettingsSync().otelEnabled
  ? ServicesLive.pipe(Layer.provideMerge(TelemetryLive))
  : ServicesLive;

/**
 * Shared `Atom.runtime` instance backed by the fully-composed application `Layer`.
 *
 * The layer graph includes `UserService`, `PostService`, `FilterRef`,
 * `NavigationService`, `CommandService`, and `ApiLive`. When the `otelEnabled`
 * debug flag is set in `localStorage`, `TelemetryLive` is merged in so that
 * OTLP tracing and logging are active for the entire runtime.
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
