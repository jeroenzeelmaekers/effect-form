import { AnthropicClient, AnthropicLanguageModel } from "@effect/ai-anthropic";
import { Layer } from "effect";
import { FetchHttpClient } from "effect/unstable/http";

/**
 * Provides the `AnthropicClient` via the `/anthropic` proxy endpoint.
 * Falls back gracefully — the API call will fail with an auth error if the
 * key is missing, but the app will boot without crashing.
 */
const AnthropicClientLive = AnthropicClient.layer({
  apiUrl: "/anthropic",
}).pipe(Layer.provide(FetchHttpClient.layer));

/**
 * Provides `LanguageModel` backed by claude-haiku-4-5 — the cheapest and
 * fastest Claude model, more than capable for single-turn tool-calling prompts.
 */
export const LanguageModelLive = AnthropicLanguageModel.layer({
  model: "claude-haiku-4-5",
}).pipe(Layer.provide(AnthropicClientLive));
