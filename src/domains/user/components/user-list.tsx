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
import { useState } from "react";

import { optimisticGetUsersAtom } from "@/domains/user/atoms";
import { Error } from "@/shared/components/ui/error";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";

import { UserColumns } from "./table-columns";

interface DataTableProps<TData extends { id: number }, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

// DataTable
function DataTable<TData extends { id: number }, TValue>({
  columns,
  data,
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
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="p-0">
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table
              .getRowModel()
              .rows.map((row) => <DataTableRow key={row.id} row={row} />)
          ) : (
            <EmptyDataTableRow colSpan={columns.length} />
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// Data row
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

// Empty state row
function EmptyDataTableRow({ colSpan }: { colSpan: number }) {
  return (
    <TableRow data-testid="empty-row">
      <TableCell colSpan={colSpan} className="h-24 text-center">
        No users yet. Create one to get started.
      </TableCell>
    </TableRow>
  );
}

const skeletonCell = <Skeleton className="h-4 w-24" />;

// Skeleton loading
function Loading<TData, TValue>({
  columns,
}: {
  columns: ColumnDef<TData, TValue>[];
}) {
  return (
    <div
      className="overflow-hidden rounded-md border"
      data-testid="user-list-loading">
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
          {Array.from({ length: 10 }).map((_, index) => (
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

// User list
export default function UserList() {
  const result = useAtomValue(optimisticGetUsersAtom);

  if (result.waiting && !AsyncResult.isSuccess(result)) {
    return (
      <section aria-label="Users" className="min-w-0 flex-1">
        <Loading columns={UserColumns} />
      </section>
    );
  }

  return (
    <section className="min-w-0 flex-1">
      {AsyncResult.builder(result)
        .onInitial(() => <Loading columns={UserColumns} />)
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
          <DataTable columns={UserColumns} data={Array.from(users)} />
        ))
        .render()}
    </section>
  );
}
