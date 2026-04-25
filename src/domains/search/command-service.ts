import { Context, Effect, Layer, Schema, SubscriptionRef } from "effect";
import { LanguageModel, Tool, Toolkit } from "effect/unstable/ai";

import { LanguageModelLive } from "@/domains/ai/language-model";
import { NavigationService } from "@/domains/search/navigation-service";
import { FilterRef } from "@/domains/user/filter-ref";

/**
 * Tool that Claude can call to navigate to the users list and apply a filter.
 *
 * Parameters:
 * - `filterQuery` — optional filter query string using the app's filter syntax:
 *     `field:value`, `AND` / `OR` boolean operators, and grouping with parens.
 *     Supported fields: `name`, `username`, `email`.
 *     Examples:
 *       `email:john@acme.com`
 *       `name:alice AND email:*@acme.com`
 *       `(name:alice OR name:bob)`
 */
const ShowUsersTool = Tool.make("show_users", {
  description:
    "Navigate to the users list page and optionally filter the results. " +
    "Use field:value syntax to filter. Supported fields: name, username, email. " +
    "Combine with AND / OR and group with parentheses.",
  parameters: Schema.Struct({
    filterQuery: Schema.String.annotate({
      description:
        'Filter query string, e.g. "email:john@acme.com" or "name:alice AND email:*@acme.com". ' +
        "Leave empty to just navigate to the users page without filtering.",
    }),
  }),
  success: Schema.Void,
  failure: Schema.Never,
});

const CommandToolkit = Toolkit.make(ShowUsersTool);

const SYSTEM_PROMPT = `You are a navigation assistant for a user management application.

When the user asks to find, show, filter, or search for users, call the show_users tool with the appropriate filterQuery.

Filter query syntax:
- Field filters: name:<value>, username:<value>, email:<value>
- Boolean operators: AND, OR (uppercase)
- Grouping: use parentheses, e.g. (name:alice OR name:bob)
- Wildcard: use * for partial matches, e.g. email:*@acme.com
- Free text (no field prefix) matches across all fields

If the user asks for something unrelated to users or navigation, still call show_users with no filterQuery to navigate to the users page.

Always call the show_users tool — do not respond with plain text.`;

const make = Effect.gen(function* () {
  const filterRef = yield* FilterRef;
  const nav = yield* NavigationService;

  // Build a handlers Context with the closed-over shared service instances.
  const handlersCtx = yield* CommandToolkit.toHandlers({
    show_users: (params: { readonly filterQuery: string }) =>
      Effect.gen(function* () {
        // Navigate first so UserFilter mounts and subscribes to FilterRef
        // *before* we write the new value. SubscriptionRef.changes only
        // emits subsequent updates, so if we set before navigation the
        // freshly-mounted component would miss the emission.
        yield* nav.navigate("/");
        yield* SubscriptionRef.set(filterRef, params.filterQuery);
      }),
  });

  const processPrompt = (prompt: string) =>
    // Yield CommandToolkit in the context where handlersCtx is provided,
    // then call generateText with the resulting WithHandler.
    Effect.gen(function* () {
      const toolkitWithHandler = yield* CommandToolkit;
      yield* LanguageModel.generateText({
        prompt: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        toolkit: toolkitWithHandler,
      });
    }).pipe(
      // The tool handler (filter + navigation) runs before generateText
      // resolves. If the library fails to decode the response metadata
      // (a known @effect/ai-anthropic bug with the `caller.toolId`
      // field), the side-effects have already succeeded — log and ignore.
      Effect.catchTag("AiError", (e) =>
        Effect.logWarning(
          `AiError suppressed (known @effect/ai-anthropic caller.toolId bug): ${e.message}`,
        ),
      ),
      Effect.provide(handlersCtx),
      Effect.provide(LanguageModelLive),
    );

  return { processPrompt } as const;
});

/**
 * Service that processes a natural-language prompt from the command center
 * and invokes the appropriate tool calls (navigation + filtering) as
 * side-effects within the Effect runtime.
 *
 * The component calling this service only needs to handle loading/error states —
 * all navigation and filter logic lives here.
 *
 * Depends on `FilterRef` and `NavigationService` being provided externally
 * (i.e. via the top-level runtime layer) so they can be shared with other parts
 * of the application.
 */
export class CommandService extends Context.Service<CommandService>()(
  "CommandService",
  { make },
) {
  static readonly layer = Layer.effect(this)(this.make);
}
