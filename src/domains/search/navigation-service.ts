import { Context, Effect, Layer } from "effect";

import { navigate } from "@/infrastructure/navigation";

/**
 * Effect service that bridges TanStack Router navigation into the Effect world.
 *
 * Rather than importing the router directly in every service that needs it,
 * all navigation side-effects go through this single service. This makes the
 * dependency explicit in the Effect type system and keeps services testable
 * (swap out the layer in tests to assert navigation calls without actually
 * navigating).
 *
 * The `navigate` method performs a TanStack Router navigation to the given
 * path. If the app is already on that route, TanStack Router treats it as a
 * no-op for the route transition itself — only the search params / state
 * supplied by callers will change.
 *
 * The router navigation function is registered by app startup code so this
 * service can navigate without importing the router module and creating a
 * circular module-initialisation cycle.
 */
export class NavigationService extends Context.Service<
  NavigationService,
  { navigate: (to: string) => Effect.Effect<void> }
>()("NavigationService") {
  static readonly layer = Layer.effect(NavigationService)(
    Effect.succeed({
      navigate: (to: string) =>
        Effect.promise(() => navigate(to)),
    }),
  );
}
