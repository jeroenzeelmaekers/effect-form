import type { Column, ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp } from "lucide-react";

import { Button } from "@/shared/components/ui/button";

import type { User } from "../model";

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

function sortLabel(column: Column<User>, name: string) {
  const sorted = column.getIsSorted();
  if (sorted === "asc") return `Sort ${name} descending`;
  if (sorted === "desc") return `Clear ${name} sort`;
  return `Sort ${name} ascending`;
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
        data-testid="sort-name"
        variant="ghost"
        className="h-full w-full justify-between rounded-none"
        aria-label={sortLabel(column, "name")}
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
        data-testid="sort-username"
        variant="ghost"
        className="h-full w-full justify-between rounded-none"
        aria-label={sortLabel(column, "username")}
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
        data-testid="sort-email"
        variant="ghost"
        className="h-full w-full justify-between rounded-none"
        aria-label={sortLabel(column, "email")}
        onClick={() => handleSortToggle(column)}>
        Email
        {sortIcon(column)}
      </Button>
    ),
  },
];

export { UserColumns };
