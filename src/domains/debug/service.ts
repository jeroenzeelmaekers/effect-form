import { Effect, Schema } from 'effect';

const STORAGE_KEYS = {
  simulation: 'debug:simulation:v1',
  otel: 'debug:otel:v1',
} as const;

export const DebugSettings = Schema.Struct({
  simulationEnabled: Schema.Boolean,
  otelEnabled: Schema.Boolean,
});

export type DebugSettings = typeof DebugSettings.Type;

const readBoolean = (key: string, defaultValue: boolean): boolean => {
  try {
    const stored = localStorage.getItem(key);
    if (stored === 'true') return true;
    if (stored === 'false') return false;
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

// Synchronous getter for Layer composition at module load time
export const getDebugSettingsSync = (): DebugSettings => ({
  simulationEnabled: readBoolean(STORAGE_KEYS.simulation, false),
  otelEnabled: readBoolean(STORAGE_KEYS.otel, false),
});

export class DebugService extends Effect.Service<DebugService>()(
  'DebugService',
  {
    accessors: true,
    effect: Effect.sync(() => {
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
  },
) {}
