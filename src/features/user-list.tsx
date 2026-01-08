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
        .onErrorTag('UserNotFound', (cause) => (
          <Error message={cause['message']} />
        ))
        .onErrorTag('NetworkError', (cause) => (
          <Error message={cause['message']} />
        ))
        .onErrorTag('ValidationError', (cause) => (
          <Error message={cause['message']} />
        ))
        .onSuccess((users) => <DataTable columns={UserColumns} data={users} />)
        .render()}
    </section>
  );
}
