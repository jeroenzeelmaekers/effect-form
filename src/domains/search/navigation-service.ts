import { Context, Effect, Layer } from "effect";

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
 * The router is imported lazily (inside the `navigate` call) to avoid a
 * circular module-initialisation cycle:
 *   runtime.ts → navigation-service.ts → router.ts → routeTree.gen.ts
 *     → __root.tsx → command-center.tsx → search/atoms.ts → runtime.ts
 */
export class NavigationService extends Context.Service<
  NavigationService,
  { navigate: (to: string) => Effect.Effect<void> }
>()("NavigationService") {
  static readonly layer = Layer.effect(NavigationService)(
    Effect.succeed({
      navigate: (to: string) =>
        Effect.promise(async () => {
          const { router } = await import("@/router");
          await router.navigate({ to } as Parameters<typeof router.navigate>[0]);
        }),
    }),
  );
}
