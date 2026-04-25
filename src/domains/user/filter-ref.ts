import { Context, Layer, SubscriptionRef } from "effect";

/**
 * Shared reactive reference that holds the current user filter query string.
 *
 * This service is the single source of truth for the active filter value. Both
 * `UserFilter` (via `useFilterRef`) and the AI `CommandService` `show_users`
 * tool handler write to and read from this ref.
 *
 * `UserFilter` syncs this ref bidirectionally with the `nuqs` URL query param
 * so the filter is always reflected in the URL. The AI tool handler writes
 * directly to this ref, which causes `UserFilter` to pick up the new value and
 * push it to the URL in turn.
 */
export class FilterRef extends Context.Service<
  FilterRef,
  SubscriptionRef.SubscriptionRef<string>
>()("FilterRef") {
  static readonly layer = Layer.effect(FilterRef)(
    SubscriptionRef.make(""),
  );
}
