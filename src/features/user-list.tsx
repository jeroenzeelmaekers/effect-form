import { Button } from '@/components/ui/button';
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
import {
  Atom,
  Result,
  useAtomRefresh,
  useAtomValue,
} from '@effect-atom/atom-react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type Row,
} from '@tanstack/react-table';
import { useMemo, type ReactNode } from 'react';

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

// Error message
function Error({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <span className="text-sm text-red-500">{message}</span>
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
          <ErrorWithRefresh
            title="Unable to find users"
            atom={optimisticGetUsersAtom}>
            <p className="text-sm">
              We where unable to fetch the users due to a technical issue on our
              end. Please try fetching the users again. If the issue keeps
              happing{' '}
              <a
                className="underline underline-offset-2"
                href={`mailto:contact@jeroenzeelmaekers.com?subject=Effect form: User not found&body=I keep getting a 'Users Not Found' error when trying to fetch the users. Please assist. traceId: ${error.traceId}`}>
                contact Customer Care.
              </a>
            </p>
          </ErrorWithRefresh>
        ))
        .onError((cause) => (
          <Error
            message={
              ('problemDetail' in cause
                ? (cause.problemDetail?.detail ?? cause.problemDetail?.title)
                : undefined) ?? 'An unexpected error occurred'
            }
          />
        ))
        .onSuccess((users) => <DataTable columns={UserColumns} data={users} />)
        .render()}
    </section>
  );
}

type ErrorProps<T> = {
  title: string;
  atom: Atom.Atom<T>;
  children?: ReactNode;
};

function ErrorWithRefresh<T>({ title, children, atom }: ErrorProps<T>) {
  const refetchUsers = useAtomRefresh(atom);
  return (
    <article className="m-auto max-w-2/3 space-y-3">
      <div className="space-y-2">
        <h1 className="text-xl font-bold">{title}</h1>
        {children}
      </div>
      <div className="flex flex-row justify-end gap-2">
        <Button variant="default" onClick={refetchUsers}>
          Try Again
        </Button>
      </div>
    </article>
  );
}
