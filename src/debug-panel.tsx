import { Result, useAtomSet, useAtomValue } from "@effect-atom/atom-react";
import { BugIcon } from "lucide-react";

import {
  debugSettingsAtom,
  setSimulationEnabledAtom,
  setOtelEnabledAtom,
} from "./domains/debug/atoms";
import { Button } from "./shared/components/ui/button";
import { Label } from "./shared/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "./shared/components/ui/sheet";
import { Skeleton } from "./shared/components/ui/skeleton";
import { Switch } from "./shared/components/ui/switch";

export default function DebugPanel() {
  const settingsResult = useAtomValue(debugSettingsAtom);
  const setSimulationEnabled = useAtomSet(setSimulationEnabledAtom);
  const setOtelEnabled = useAtomSet(setOtelEnabledAtom);

  const isLoading =
    Result.isInitial(settingsResult) || Result.isWaiting(settingsResult);

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
        {isLoading ? (
          <div className="flex flex-col gap-6 px-6 pb-6 lg:mx-auto lg:w-full lg:max-w-1/2">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-5 w-9 rounded-full" />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-4 w-56" />
              </div>
              <Skeleton className="h-5 w-9 rounded-full" />
            </div>
          </div>
        ) : Result.isSuccess(settingsResult) ? (
          <div className="flex flex-col gap-6 px-6 pb-6 lg:mx-auto lg:w-full lg:max-w-1/2">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <Label
                  htmlFor="debug-simulation"
                  className="text-sm font-medium">
                  Simulation Mode
                </Label>
                <span className="text-muted-foreground text-xs">
                  Mock errors for testing and development without the need for
                  API failures.
                </span>
              </div>
              <Switch
                id="debug-simulation"
                checked={settingsResult.value.simulationEnabled}
                onCheckedChange={setSimulationEnabled}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <Label htmlFor="debug-otel" className="text-sm font-medium">
                  OpenTelemetry
                </Label>
                <span className="text-muted-foreground text-xs">
                  Enable tracing and metrics collection for observability.
                </span>
              </div>
              <Switch
                id="debug-otel"
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
