import { Error } from '@/components/ui/error';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { optimisticGetUsersAtom } from '@/lib/api/user.atoms';
import { UserColumns } from '@/models/user';
import { Result, useAtomValue } from '@effect-atom/atom-react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type Row,
} from '@tanstack/react-table';
import { useMemo } from 'react';

interface DataTableProps<TData extends { id: number }, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: readonly TData[];
}

// DataTable
function DataTable<TData extends { id: number }, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  'use no memo';
  const memoizedData = useMemo(() => [...data], [data]);

  const table = useReactTable({
    data: memoizedData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="w-full overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
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
      data-state={row.getIsSelected() && 'selected'}
      className={isOptimistic ? 'text-muted-foreground' : ''}>
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
    <TableRow>
      <TableCell colSpan={colSpan} className="h-24 text-center">
        No results.
      </TableCell>
    </TableRow>
  );
}

// Loading state
function Loading<TData, TValue>({
  columns,
}: {
  columns: ColumnDef<TData, TValue>[];
}) {
  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead key={index}>
                {typeof column.header === 'string' ? column.header : null}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 10 }).map((_, index) => (
            <TableRow key={index}>
              {columns.map((_, colIndex) => (
                <TableCell key={colIndex}>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// Main UserList component
export default function UserList() {
  const result = useAtomValue(optimisticGetUsersAtom);
  return (
    <section className="min-w-0 flex-1">
      {Result.builder(result)
        .onInitial(() => <Loading columns={UserColumns} />)
        .onWaiting(() => <Loading columns={UserColumns} />)
        .onErrorTag('UserNotFound', (error) => (
          <Error.Root>
            <Error.Content>
              <Error.Title>Unable to find users</Error.Title>
              <Error.Description>
                We where unable to fetch the users due to a technical issue on
                our end. Please try fetching the users again. If the issue keeps
                happing{' '}
                <a
                  className="underline underline-offset-2"
                  href={`mailto:contact@jeroenzeelmaekers.com?subject=${encodeURIComponent('Effect form: Users not found')}&body=${encodeURIComponent(`


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
        .onErrorTag('NetworkError', (error) => (
          <Error.Root>
            <Error.Content>
              <Error.Title>Connection failed</Error.Title>
              <Error.Description>
                We couldn't connect to the server. Please check your internet
                connection and try again. If the issue keeps happening{' '}
                <a
                  className="underline underline-offset-2"
                  href={`mailto:contact@jeroenzeelmaekers.com?subject=${encodeURIComponent('Effect form: Connection failed')}&body=${encodeURIComponent(`


---
Do not remove this information:
Trace ID: ${error.traceId}`)}`}>
                  contact Customer Care.
                </a>
              </Error.Description>
            </Error.Content>
          </Error.Root>
        ))
        .onErrorTag('ValidationError', (error) => (
          <Error.Root>
            <Error.Content>
              <Error.Title>Invalid data received</Error.Title>
              <Error.Description>
                The server returned data in an unexpected format. This is likely
                a temporary issue. Please try again later. If the issue keeps
                happening{' '}
                <a
                  className="underline underline-offset-2"
                  href={`mailto:contact@jeroenzeelmaekers.com?subject=${encodeURIComponent('Effect form: Invalid data received')}&body=${encodeURIComponent(`


---
Do not remove this information:
Trace ID: ${error.traceId}`)}`}>
                  contact Customer Care.
                </a>
              </Error.Description>
            </Error.Content>
          </Error.Root>
        ))
        .onError(() => (
          <Error.Root>
            <Error.Content>
              <Error.Title>Something went wrong</Error.Title>
              <Error.Description>
                An unexpected error occurred while loading the users. Please try
                again later. If the issue keeps happening{' '}
                <a
                  className="underline underline-offset-2"
                  href={`mailto:contact@jeroenzeelmaekers.com?subject=${encodeURIComponent('Effect form: Unexpected error')}`}>
                  contact Customer Care.
                </a>
              </Error.Description>
            </Error.Content>
          </Error.Root>
        ))
        .onSuccess((users) => <DataTable columns={UserColumns} data={users} />)
        .render()}
    </section>
  );
}
