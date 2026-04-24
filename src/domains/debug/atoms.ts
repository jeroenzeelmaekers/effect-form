import { Effect } from "effect";
import { Atom } from "effect/unstable/reactivity";

import { DebugService } from "./service";

const debugRuntimeAtom = Atom.runtime(DebugService.layer);

/**
 * Reactive atom that reads the current debug settings from `DebugService`.
 *
 * Subscribing components receive the latest `DebugSettings` value on mount.
 * Because settings changes always trigger a full page reload, this atom does
 * not need invalidation — it simply reflects what is persisted in `localStorage`.
 */
export const debugSettingsAtom = debugRuntimeAtom.atom(
  Effect.gen(function* () {
    const svc = yield* DebugService;
    return yield* svc.get;
  }),
);

/**
 * Reactive atom factory that enables or disables the API simulation layer.
 *
 * Calling the returned function persists the new value to `localStorage` and
 * reloads the page so the application runtime is rebuilt with the updated flag.
 *
 * @param enabled - `true` to enable simulated API errors; `false` to disable.
 */
export const setSimulationEnabledAtom = debugRuntimeAtom.fn(
  (enabled: boolean) =>
    Effect.gen(function* () {
      const svc = yield* DebugService;
      return yield* svc.setSimulationEnabled(enabled);
    }),
);

/**
 * Reactive atom factory that enables or disables OpenTelemetry instrumentation.
 *
 * Calling the returned function persists the new value to `localStorage` and
 * reloads the page so the application runtime is rebuilt with the updated flag.
 *
 * @param enabled - `true` to enable OTLP tracing and logging; `false` to disable.
 */
export const setOtelEnabledAtom = debugRuntimeAtom.fn((enabled: boolean) =>
  Effect.gen(function* () {
    const svc = yield* DebugService;
    return yield* svc.setOtelEnabled(enabled);
  }),
);
