import { useAtom } from "@effect/atom-react";
import { useHotkey } from "@tanstack/react-hotkeys";
import { AsyncResult } from "effect/unstable/reactivity";
import { Loader2 } from "lucide-react";
import { useState } from "react";

import { processPromptAtom } from "@/domains/search/atoms";
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
  const [result, run] = useAtom(processPromptAtom, { mode: "promise" });
  useHotkey("Mod+K", () => setOpen(true));

  const isPending = AsyncResult.isWaiting(result);
  const error = AsyncResult.isFailure(result) ? result.cause : null;

  function handleSubmit(value: string) {
    if (!value.trim() || isPending) return;
    run(value)
      .then(() => setOpen(false))
      .catch(() => {
        // error is surfaced via AsyncResult.isFailure above
      });
  }

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
          <div className="relative">
            <CommandInput
              placeholder="Type a prompt, e.g. show users with email @acme.com…"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSubmit(e.currentTarget.value);
                }
              }}
            />
            {isPending && (
              <Loader2 className="text-muted-foreground absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin" />
            )}
          </div>
          <CommandList>
            {error ? (
              <p className="text-destructive px-4 py-3 text-sm">
                Something went wrong. Please try again.
              </p>
            ) : (
              <CommandEmpty>No results found.</CommandEmpty>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </div>
  );
}
