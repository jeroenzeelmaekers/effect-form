import { useAtomValue } from "@effect/atom-react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type Row,
  type SortingState,
} from "@tanstack/react-table";
import { AsyncResult } from "effect/unstable/reactivity";
import { parseAsString, useQueryState } from "nuqs";
import { useState } from "react";

import { optimisticGetUsersAtom } from "@/domains/user/atoms";
import { UserFilter } from "@/domains/user/components/user-filter";
import { applyFilter, parseFilterQuery } from "@/domains/user/filter";
import type { User } from "@/domains/user/model";
import { Error } from "@/shared/components/ui/error";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";

import { UserColumns } from "./table-columns";

interface DataTableProps<TData extends { id: number }, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isFiltered?: boolean;
}

function DataTable<TData extends { id: number }, TValue>({
  columns,
  data,
  isFiltered = false,
}: DataTableProps<TData, TValue>) {
  "use no memo";
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
  });

  return (
    <div className="w-full overflow-x-auto rounded-md border">
      <Table>
        <TableCaption>List of registered users</TableCaption>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const sorted = header.column.getIsSorted();
                return (
                  <TableHead
                    key={header.id}
                    className="p-0"
                    aria-sort={
                      sorted === "asc"
                        ? "ascending"
                        : sorted === "desc"
                          ? "descending"
                          : "none"
                    }>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table
              .getRowModel()
              .rows.map((row) => <DataTableRow key={row.id} row={row} />)
          ) : (
            <EmptyDataTableRow
              colSpan={columns.length}
              isFiltered={isFiltered}
            />
          )}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * Single row for the data table containing a user
 */
function DataTableRow<TData extends { id: number }>({
  row,
}: {
  row: Row<TData>;
}) {
  const isOptimistic = row.original.id < 0;
  return (
    <TableRow
      key={row.id}
      data-testid={`user-row-${row.original.id}`}
      data-state={row.getIsSelected() && "selected"}
      className={isOptimistic ? "text-muted-foreground" : ""}>
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}

function EmptyDataTableRow({
  colSpan,
  isFiltered = false,
}: {
  colSpan: number;
  isFiltered?: boolean;
}) {
  return (
    <TableRow data-testid="empty-row">
      <TableCell colSpan={colSpan} className="h-24 text-center">
        {isFiltered
          ? "No users match your filter."
          : "No users yet. Create one to get started."}
      </TableCell>
    </TableRow>
  );
}

const skeletonCell = <Skeleton className="h-4 w-24" />;

function Loading<TData, TValue>({
  columns,
  tableSize = 10,
}: {
  columns: ColumnDef<TData, TValue>[];
  tableSize?: number;
}) {
  return (
    <div
      className="overflow-hidden rounded-md border"
      data-testid="user-list-loading"
      aria-busy="true"
      aria-label="Loading users">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead key={index}>
                {typeof column.header === "string" ? column.header : null}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: tableSize }).map((_, index) => (
            <TableRow key={index}>
              {columns.map((_, colIndex) => (
                <TableCell key={colIndex}>{skeletonCell}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * Displays the list of users fetched via {@link optimisticGetUsersAtom}.
 *
 * Renders a skeleton loading table while the initial fetch is in progress.
 * Once data is available the list is filtered client-side using the `filter`
 * URL query parameter (parsed via `nuqs`) and rendered in a sortable
 * {@link DataTable}.
 *
 * Typed error states — `NotFoundError`, `NetworkError`, `ValidationError`, and
 * a generic fallback — each render a distinct {@link Error} UI block with a
 * contextual mailto link that pre-populates the OTel trace ID for support.
 */
export default function UserList() {
  const result = useAtomValue(optimisticGetUsersAtom);
  const [filterQuery] = useQueryState("filter", parseAsString.withDefault(""));
  const ast = parseFilterQuery(filterQuery);
  const filtered = ast !== null;

  if (AsyncResult.isWaiting(result) && !AsyncResult.isSuccess(result)) {
    return (
      <section aria-label="Users" className="min-w-0 flex-1">
        <div className="flex flex-col gap-2">
          <UserFilter />
          <Loading columns={UserColumns} />
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Users" className="min-w-0 flex-1">
      {AsyncResult.builder(result)
        .onInitial(() => (
          <>
            <UserFilter />
            <Loading columns={UserColumns} />
          </>
        ))
        .onErrorTag("NotFoundError", (error) => (
          <Error.Root>
            <Error.Content>
              <Error.Title>Unable to find users</Error.Title>
              <Error.Description>
                We where unable to fetch the users due to a technical issue on
                our end. Please try fetching the users again. If the issue keeps
                happening{" "}
                <a
                  className="underline underline-offset-2"
                  href={`mailto:contact@jeroenzeelmaekers.com?subject=${encodeURIComponent("Effect form: Users not found")}&body=${encodeURIComponent(`


---
Do not remove this information:
Trace ID: ${error.traceId}`)}`}>
                  contact Customer Care.
                </a>
              </Error.Description>
            </Error.Content>
            <Error.Actions>
              <Error.Refresh atom={optimisticGetUsersAtom} />
            </Error.Actions>
          </Error.Root>
        ))
        .onErrorTag("NetworkError", (error) => (
          <Error.Root>
            <Error.Content>
              <Error.Title>Connection failed</Error.Title>
              <Error.Description>
                We couldn't connect to the server. Please check your internet
                connection and try again. If the issue keeps happening{" "}
                <a
                  className="underline underline-offset-2"
                  href={`mailto:contact@jeroenzeelmaekers.com?subject=${encodeURIComponent("Effect form: Connection failed")}&body=${encodeURIComponent(`


---
Do not remove this information:
Trace ID: ${error.traceId}`)}`}>
                  contact Customer Care.
                </a>
              </Error.Description>
            </Error.Content>
            <Error.Actions>
              <Error.Refresh atom={optimisticGetUsersAtom} />
            </Error.Actions>
          </Error.Root>
        ))
        .onErrorTag("ValidationError", (error) => (
          <Error.Root>
            <Error.Content>
              <Error.Title>Invalid data received</Error.Title>
              <Error.Description>
                The server returned data in an unexpected format. This is likely
                a temporary issue. Please try again later. If the issue keeps
                happening{" "}
                <a
                  className="underline underline-offset-2"
                  href={`mailto:contact@jeroenzeelmaekers.com?subject=${encodeURIComponent("Effect form: Invalid data received")}&body=${encodeURIComponent(`


---
Do not remove this information:
Trace ID: ${error.traceId}`)}`}>
                  contact Customer Care.
                </a>
              </Error.Description>
            </Error.Content>
            <Error.Actions>
              <Error.Refresh atom={optimisticGetUsersAtom} />
            </Error.Actions>
          </Error.Root>
        ))
        .onError(() => (
          <Error.Root>
            <Error.Content>
              <Error.Title>Something went wrong</Error.Title>
              <Error.Description>
                An unexpected error occurred while loading the users. Please try
                again later. If the issue keeps happening{" "}
                <a
                  className="underline underline-offset-2"
                  href={`mailto:contact@jeroenzeelmaekers.com?subject=${encodeURIComponent("Effect form: Unexpected error")}`}>
                  contact Customer Care.
                </a>
              </Error.Description>
            </Error.Content>
            <Error.Actions>
              <Error.Refresh atom={optimisticGetUsersAtom} />
            </Error.Actions>
          </Error.Root>
        ))
        .onSuccess((users) => (
          <div className="flex flex-col gap-2">
            <UserFilter />
            <DataTable
              columns={UserColumns}
              data={applyFilter(Array.from(users) as User[], ast)}
              isFiltered={filtered}
            />
          </div>
        ))
        .render()}
    </section>
  );
}
