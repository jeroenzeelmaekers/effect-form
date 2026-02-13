import { Atom } from "@effect-atom/atom";

import { DebugService } from "./service";

const debugRuntimeAtom = Atom.runtime(DebugService.Default);

export const debugSettingsAtom = debugRuntimeAtom.atom(DebugService.get);

export const setSimulationEnabledAtom = debugRuntimeAtom.fn(
  DebugService.setSimulationEnabled,
);

export const setOtelEnabledAtom = debugRuntimeAtom.fn(
  DebugService.setOtelEnabled,
);
