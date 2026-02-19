import { Atom } from "effect/unstable/reactivity";
import { Effect } from "effect";

import { DebugService } from "./service";

const debugRuntimeAtom = Atom.runtime(DebugService.layer);

export const debugSettingsAtom = debugRuntimeAtom.atom(
  Effect.gen(function* () {
    const svc = yield* DebugService;
    return yield* svc.get;
  }),
);

export const setSimulationEnabledAtom = debugRuntimeAtom.fn(
  (enabled: boolean) =>
    Effect.gen(function* () {
      const svc = yield* DebugService;
      return yield* svc.setSimulationEnabled(enabled);
    }),
);

export const setOtelEnabledAtom = debugRuntimeAtom.fn(
  (enabled: boolean) =>
    Effect.gen(function* () {
      const svc = yield* DebugService;
      return yield* svc.setOtelEnabled(enabled);
    }),
);
