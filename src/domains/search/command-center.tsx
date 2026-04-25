import { useHotkey } from "@tanstack/react-hotkeys";
import { useState } from "react";

import { Button } from "@/shared/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandList,
} from "@/shared/components/ui/command";
import { Kbd } from "@/shared/components/ui/kbd";

export default function CommandCenter() {
  const [open, setOpen] = useState(false);
  useHotkey("Mod+K", () => setOpen(true));

  return (
    <div className="flex max-w-md flex-1 flex-col gap-4">
      <Button
        onClick={() => setOpen(true)}
        className="bg-input/20 dark:bg-input/30 border-input text-muted-foreground h-8.5 w-full min-w-0 justify-between rounded-md border px-2 py-0.5 text-sm font-normal shadow-none transition-colors md:text-xs/relaxed">
        Ready at your next command...
        <div className="space-x-1.5">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </div>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput placeholder="Type a command or prompt..."></CommandInput>
          <CommandList>
            <CommandEmpty>No Results found.</CommandEmpty>
          </CommandList>
        </Command>
      </CommandDialog>
    </div>
  );
}
