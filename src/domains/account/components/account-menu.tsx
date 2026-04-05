import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/unstable/reactivity";
import { BugIcon, Moon, Sun } from "lucide-react";

import {
  debugSettingsAtom,
  setOtelEnabledAtom,
  setSimulationEnabledAtom,
} from "@/domains/debug/atoms";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { useTheme } from "@/shared/providers/theme-provider";

export default function AccountMenu() {
  const { theme, setTheme } = useTheme();

  const settingsResult = useAtomValue(debugSettingsAtom);
  const setSimulationEnabled = useAtomSet(setSimulationEnabledAtom);
  const setOtelEnabled = useAtomSet(setOtelEnabledAtom);

  const isDebugLoaded = AsyncResult.isSuccess(settingsResult);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="rounded-full">
            <Avatar size="sm">
              <AvatarImage
                src="https://github.com/jeroenzeelmaekers.png"
                alt="jeroenzeelmaekers"
              />
              <AvatarFallback>JZ</AvatarFallback>
            </Avatar>
          </Button>
        }
      />
      <DropdownMenuContent className="w-48" align="end">
        <DropdownMenuGroup>
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Billing</DropdownMenuItem>
          <DropdownMenuItem>Settings</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Sun className="scale-100 dark:scale-0" />
              <Moon className="absolute scale-0 dark:scale-100" />
              Theme
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                value={theme}
                onValueChange={(value) =>
                  setTheme(value as "light" | "dark" | "system")
                }>
                <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <BugIcon />
              Debug
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuLabel>Debug Settings</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                disabled={!isDebugLoaded}
                checked={
                  isDebugLoaded
                    ? settingsResult.value.simulationEnabled
                    : false
                }
                onCheckedChange={setSimulationEnabled}>
                Simulation Mode
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                disabled={!isDebugLoaded}
                checked={
                  isDebugLoaded ? settingsResult.value.otelEnabled : false
                }
                onCheckedChange={setOtelEnabled}>
                OpenTelemetry
              </DropdownMenuCheckboxItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem variant="destructive">Log out</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
