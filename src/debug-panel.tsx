import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/unstable/reactivity";
import { BugIcon } from "lucide-react";

import {
  debugSettingsAtom,
  setSimulationEnabledAtom,
  setOtelEnabledAtom,
} from "./domains/debug/atoms";
import { Button } from "./shared/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "./shared/components/ui/sheet";
import { Switch } from "./shared/components/ui/switch";

export default function DebugPanel() {
  const settingsResult = useAtomValue(debugSettingsAtom);
  const setSimulationEnabled = useAtomSet(setSimulationEnabledAtom);
  const setOtelEnabled = useAtomSet(setOtelEnabledAtom);

  const isLoading =
    AsyncResult.isInitial(settingsResult) ||
    AsyncResult.isWaiting(settingsResult);

  return (
    <Sheet key="top">
      <SheetTrigger
        render={
          <Button size="icon" variant="outline" aria-label="Open debug panel">
            <BugIcon />
          </Button>
        }
      />
      <SheetContent side="top">
        <SheetHeader className="lg:mx-auto lg:w-full lg:max-w-1/2">
          <SheetTitle>Debug Settings</SheetTitle>
          <SheetDescription>
            Configure development and debugging options.
          </SheetDescription>
        </SheetHeader>
        {isLoading ? null : AsyncResult.isSuccess(settingsResult) ? (
          <div className="flex flex-col gap-6 px-6 pb-6 lg:mx-auto lg:w-full lg:max-w-1/2">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">Simulation Mode</span>
                <span className="text-muted-foreground text-xs">
                  Mock errors for testing and development without the need for
                  API failures.
                </span>
              </div>
              <Switch
                checked={settingsResult.value.simulationEnabled}
                onCheckedChange={setSimulationEnabled}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">OpenTelemetry</span>
                <span className="text-muted-foreground text-xs">
                  Enable tracing and metrics collection for observability.
                </span>
              </div>
              <Switch
                checked={settingsResult.value.otelEnabled}
                onCheckedChange={setOtelEnabled}
              />
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
