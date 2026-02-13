import type { Column, ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp } from "lucide-react";

import { Button } from "@/shared/components/ui/button";

import type { User } from "./model";

function handleSortToggle(column: Column<User>) {
  const current = column.getIsSorted();
  if (current === false) {
    column.toggleSorting(false);
  } else if (current === "asc") {
    column.toggleSorting(true);
  } else {
    column.clearSorting();
  }
}

function sortIcon(column: Column<User>) {
  const sorted = column.getIsSorted();
  return (
    <span className="ml-2 inline-flex size-4 items-center justify-center">
      {sorted === "asc" && <ArrowDown className="text-muted-foreground" />}
      {sorted === "desc" && <ArrowUp className="text-muted-foreground" />}
    </span>
  );
}

const UserColumns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="h-full w-full justify-between rounded-none"
        onClick={() => handleSortToggle(column)}>
        Name
        {sortIcon(column)}
      </Button>
    ),
  },
  {
    accessorKey: "username",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="h-full w-full justify-between rounded-none"
        onClick={() => handleSortToggle(column)}>
        Username
        {sortIcon(column)}
      </Button>
    ),
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="h-full w-full justify-between rounded-none"
        onClick={() => handleSortToggle(column)}>
        Email
        {sortIcon(column)}
      </Button>
    ),
  },
];

export { UserColumns };
