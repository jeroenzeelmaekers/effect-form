import { Effect, Layer, Schema, ServiceMap } from "effect";

const STORAGE_KEYS = {
  simulation: "debug:simulation:v1",
  otel: "debug:otel:v1",
} as const;

/**
 * Effect Schema struct describing the persisted debug settings.
 *
 * Both flags are stored as plain booleans in `localStorage` under versioned
 * keys and read synchronously on application startup.
 *
 * Fields:
 * - `simulationEnabled` — when `true`, all API requests are intercepted by the
 *   simulation layer which randomly injects errors and latency.
 * - `otelEnabled` — when `true`, the OpenTelemetry tracing/logging layer is
 *   included in the application runtime.
 */
export const DebugSettings = Schema.Struct({
  simulationEnabled: Schema.Boolean,
  otelEnabled: Schema.Boolean,
});

/** TypeScript type inferred from the `DebugSettings` schema. */
export type DebugSettings = typeof DebugSettings.Type;

const readBoolean = (key: string, defaultValue: boolean): boolean => {
  try {
    const stored = localStorage.getItem(key);
    if (stored === "true") return true;
    if (stored === "false") return false;
  } catch {
    // Fall through to default
  }
  return defaultValue;
};

const writeBoolean = (key: string, value: boolean): void => {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // Ignore storage errors
  }
};

/**
 * Synchronously reads the current debug settings from `localStorage`.
 *
 * Designed to be called during `Layer` composition at module load time (before
 * the Effect runtime is available). Falls back to `false` for both flags if
 * storage is unavailable or the keys are missing.
 *
 * @returns The current `DebugSettings` read from `localStorage`.
 */
export const getDebugSettingsSync = (): DebugSettings => ({
  simulationEnabled: readBoolean(STORAGE_KEYS.simulation, false),
  otelEnabled: readBoolean(STORAGE_KEYS.otel, false),
});

/**
 * Shape of the `DebugService` implementation provided to consumers.
 *
 * - `get` — returns the current debug settings as an `Effect`.
 * - `setSimulationEnabled` — persists the simulation toggle and reloads the page.
 * - `setOtelEnabled` — persists the OTel toggle and reloads the page.
 */
export interface DebugServiceShape {
  readonly get: Effect.Effect<DebugSettings>;
  readonly setSimulationEnabled: (enabled: boolean) => Effect.Effect<void>;
  readonly setOtelEnabled: (enabled: boolean) => Effect.Effect<void>;
}

/**
 * Effect service that manages debug feature flags backed by `localStorage`.
 *
 * Changing either flag via `setSimulationEnabled` or `setOtelEnabled` writes
 * the new value to `localStorage` and triggers a full page reload so that the
 * application runtime is reconstructed with the updated settings.
 *
 * @example
 * const settings = yield* DebugService.pipe(Effect.flatMap(svc => svc.get));
 */
export class DebugService extends ServiceMap.Service<
  DebugService,
  DebugServiceShape
>()("DebugService", {
  make: Effect.sync(() => {
    const get = Effect.sync(getDebugSettingsSync);

    const setSimulationEnabled = (enabled: boolean): Effect.Effect<void> =>
      Effect.sync(() => {
        writeBoolean(STORAGE_KEYS.simulation, enabled);
        window.location.reload();
      });

    const setOtelEnabled = (enabled: boolean): Effect.Effect<void> =>
      Effect.sync(() => {
        writeBoolean(STORAGE_KEYS.otel, enabled);
        window.location.reload();
      });

    return {
      get,
      setSimulationEnabled,
      setOtelEnabled,
    } as const;
  }),
}) {
  /** Live `Layer` that constructs `DebugService` (no external dependencies). */
  static layer = Layer.effect(this, this.make);
}
