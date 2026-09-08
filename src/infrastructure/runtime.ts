import { Layer } from "effect";
import { Atom } from "effect/unstable/reactivity";

import { getDebugSettingsSync } from "@/domains/debug/service";
import { PostService } from "@/domains/post/service";
import { CommandService } from "@/domains/search/command-service";
import { NavigationService } from "@/domains/search/navigation-service";
import { FilterRef } from "@/domains/user/filter-ref";
import { UserService } from "@/domains/user/service";
import { TelemetryLive } from "@/infrastructure/telemetry";
import { ApiLive } from "@/shared/api/client";

const DomainDependenciesLive = Layer.mergeAll(
  FilterRef.layer,
  NavigationService.layer,
);

const FeatureServicesLive = Layer.mergeAll(
  UserService.layer,
  PostService.layer,
  CommandService.layer,
).pipe(Layer.provide(DomainDependenciesLive), Layer.provide(ApiLive));

const ServicesLive = Layer.merge(DomainDependenciesLive, FeatureServicesLive);

const MainLive = getDebugSettingsSync().otelEnabled
  ? Layer.merge(ServicesLive, TelemetryLive)
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
 *     const service = yield* UserService;
 *     return yield* service.getUsers;
 *   })
 * );
 */
const runtimeMemoMap = Layer.makeMemoMapUnsafe();
const runtimeFactory = Atom.context({ memoMap: runtimeMemoMap });

export const runtimeAtom = runtimeFactory(MainLive);
