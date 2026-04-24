import { Effect } from "effect";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DebugService, getDebugSettingsSync } from "./service";

// ---- localStorage mock ----

const storage: Record<string, string> = {};

beforeEach(() => {
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => storage[key] ?? null,
    setItem: (key: string, value: string) => {
      storage[key] = value;
    },
    removeItem: (key: string) => {
      delete storage[key];
    },
    clear: () => {
      Object.keys(storage).forEach((k) => delete storage[k]);
    },
  });

  vi.stubGlobal("window", {
    location: { reload: vi.fn() },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  Object.keys(storage).forEach((k) => delete storage[k]);
});

// ---- DebugSettings schema ----

describe("DebugSettings schema", () => {
  it("should decode valid settings", () => {
    const settings = { simulationEnabled: true, otelEnabled: false };
    expect(settings).toMatchObject({
      simulationEnabled: true,
      otelEnabled: false,
    });
  });
});

// ---- getDebugSettingsSync ----

describe("getDebugSettingsSync", () => {
  it("should return false defaults when localStorage is empty", () => {
    const settings = getDebugSettingsSync();
    expect(settings).toEqual({ simulationEnabled: false, otelEnabled: false });
  });

  it("should read simulationEnabled=true from localStorage", () => {
    localStorage.setItem("debug:simulation:v1", "true");
    const settings = getDebugSettingsSync();
    expect(settings.simulationEnabled).toBe(true);
  });

  it("should read otelEnabled=true from localStorage", () => {
    localStorage.setItem("debug:otel:v1", "true");
    const settings = getDebugSettingsSync();
    expect(settings.otelEnabled).toBe(true);
  });

  it("should return false when values are explicitly 'false'", () => {
    localStorage.setItem("debug:simulation:v1", "false");
    localStorage.setItem("debug:otel:v1", "false");
    const settings = getDebugSettingsSync();
    expect(settings).toEqual({ simulationEnabled: false, otelEnabled: false });
  });

  it("should fall back to false for unrecognised stored values", () => {
    localStorage.setItem("debug:simulation:v1", "yes");
    const settings = getDebugSettingsSync();
    expect(settings.simulationEnabled).toBe(false);
  });
});

// ---- DebugService ----

describe("DebugService", () => {
  const run = <A>(effect: Effect.Effect<A, never, DebugService>) =>
    Effect.runPromise(effect.pipe(Effect.provide(DebugService.layer)));

  describe("get", () => {
    it("should return default settings when localStorage is empty", async () => {
      const settings = await run(
        Effect.gen(function* () {
          const svc = yield* DebugService;
          return yield* svc.get;
        }),
      );
      expect(settings).toEqual({
        simulationEnabled: false,
        otelEnabled: false,
      });
    });

    it("should reflect values stored in localStorage", async () => {
      localStorage.setItem("debug:simulation:v1", "true");
      localStorage.setItem("debug:otel:v1", "true");
      const settings = await run(
        Effect.gen(function* () {
          const svc = yield* DebugService;
          return yield* svc.get;
        }),
      );
      expect(settings).toEqual({ simulationEnabled: true, otelEnabled: true });
    });
  });

  describe("setSimulationEnabled", () => {
    it("should write the value to localStorage and reload", async () => {
      await run(
        Effect.gen(function* () {
          const svc = yield* DebugService;
          yield* svc.setSimulationEnabled(true);
        }),
      );
      expect(localStorage.getItem("debug:simulation:v1")).toBe("true");
      expect(window.location.reload).toHaveBeenCalledOnce();
    });

    it("should persist false and reload", async () => {
      await run(
        Effect.gen(function* () {
          const svc = yield* DebugService;
          yield* svc.setSimulationEnabled(false);
        }),
      );
      expect(localStorage.getItem("debug:simulation:v1")).toBe("false");
      expect(window.location.reload).toHaveBeenCalledOnce();
    });
  });

  describe("setOtelEnabled", () => {
    it("should write the value to localStorage and reload", async () => {
      await run(
        Effect.gen(function* () {
          const svc = yield* DebugService;
          yield* svc.setOtelEnabled(true);
        }),
      );
      expect(localStorage.getItem("debug:otel:v1")).toBe("true");
      expect(window.location.reload).toHaveBeenCalledOnce();
    });
  });
});
