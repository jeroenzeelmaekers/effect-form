import { expect, it, vi } from "vite-plus/test";
import { render } from "vitest-browser-react";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./dropdown-menu";

it("keeps submenu checkbox items clickable with Redact", async () => {
  const onCheckedChange = vi.fn();

  const screen = await render(
    <DropdownMenu>
      <DropdownMenuTrigger>Open</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Debug</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuCheckboxItem onCheckedChange={onCheckedChange}>
              Simulation Mode
            </DropdownMenuCheckboxItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>,
  );

  await screen.getByRole("button", { name: "Open" }).click();
  await screen.getByRole("menuitem", { name: "Debug" }).hover();
  await screen
    .getByRole("menuitemcheckbox", { name: "Simulation Mode" })
    .click();

  expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything());
});

it("still dismisses on an outside press with Redact", async () => {
  const onOpenChange = vi.fn();

  const screen = await render(
    <>
      <DropdownMenu modal={false} onOpenChange={onOpenChange}>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Action</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <button type="button">Outside</button>
    </>,
  );

  await screen.getByRole("button", { name: "Open" }).click();
  await screen.getByRole("button", { name: "Outside" }).click();

  expect(onOpenChange).toHaveBeenCalledWith(
    false,
    expect.objectContaining({ reason: "outside-press" }),
  );
});
