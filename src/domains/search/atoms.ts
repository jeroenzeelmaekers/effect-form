import { Effect } from "effect";

import { CommandService } from "@/domains/search/command-service";
import { runtimeAtom } from "@/infrastructure/runtime";

/**
 * Atom factory that processes a natural-language prompt through the AI
 * `CommandService`.
 *
 * On resolution the `show_users` tool handler will have already:
 * 1. Written the extracted filter query to `FilterRef`
 * 2. Navigated to `/` (no-op if already there)
 *
 * The calling component only needs to manage the loading / error state.
 *
 * @example
 * ```tsx
 * const [result, run] = useAtom(processPromptAtom);
 * run("show me users with email ending in @acme.com");
 * ```
 */
export const processPromptAtom = runtimeAtom.fn((prompt: string) =>
  Effect.gen(function* () {
    const svc = yield* Effect.service(CommandService);
    yield* svc.processPrompt(prompt);
  }),
);
