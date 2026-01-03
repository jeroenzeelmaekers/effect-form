import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SrOnly } from '@/components/ui/sr-only';
import { optimisticUsersAtom } from '@/lib/api/services';
import { cn } from '@/lib/utils';
import type { User } from '@/models/user';
import { Result, useAtomValue } from '@effect-atom/atom-react';
import { Schema } from 'effect';
import { EditIcon, Loader2, TrashIcon } from 'lucide-react';

// Define User type from schema
type User = Schema.Schema.Type<typeof User>;

function ItemActions({ user }: { user: User }) {
  function onEdit() {
    console.log('Edit user', user);
  }

  function onDelete() {
    console.log('Delete user', user);
  }

  return (
    <div className="flex items-center space-x-1">
      <Button size="icon" variant="outline" onClick={onEdit}>
        <SrOnly>Edit {user.name}</SrOnly>
        <EditIcon className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="destructive" onClick={onDelete}>
        <SrOnly>Delete {user.name}</SrOnly>
        <TrashIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Single list item card
function Item({ user }: { user: User }) {
  const isOptimistic = user.id < 0;

  return (
    <li
      className={cn('flex flex-row justify-between rounded-lg border p-3', {
        'bg-muted/50 border-dashed opacity-70': isOptimistic,
        'bg-card border-border': !isOptimistic,
      })}>
      <div className="flex-col gap-3">
        <div className="text-sm">{user.name}</div>
        <div className="text-muted-foreground text-xs/relaxed">
          @{user.username} - {user.email}
        </div>
      </div>
      <div>
        {isOptimistic ? (
          <Loader2 className="text-muted-foreground ml-2 inline-block h-4 w-4 animate-spin" />
        ) : (
          <ItemActions user={user} />
        )}
      </div>
    </li>
  );
}

// List of users
function List({ users }: { users: readonly User[] }) {
  if (users.length === 0) {
    return (
      <ul className="space-y-2">
        <li className="text-muted-foreground">No users yet</li>
      </ul>
    );
  }

  return (
    <ul className="space-y-2">
      {users.map((user) => (
        <Item key={user.id} user={user} />
      ))}
    </ul>
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

// Skeleton loader for user list
function Loading() {
  return (
    <ul className="space-y-2">
      {Array.from({ length: 10 }).map((_, i) => (
        <li
          key={i}
          className="bg-card border-border flex flex-row justify-between rounded-lg border p-3">
          <div className="flex flex-1 flex-col gap-1">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </li>
      ))}
    </ul>
  );
}

// Main UserList component
export default function UserList() {
  const result = useAtomValue(optimisticUsersAtom);

  return (
    <section className="w-full max-w-sm min-w-sm">
      {Result.builder(result)
        .onInitial(() => <Loading />)
        .onErrorTag('UserNotFound', (cause) => (
          <Error message={cause['message']} />
        ))
        .onErrorTag('NetworkError', (cause) => (
          <Error message={cause['message']} />
        ))
        .onErrorTag('ValidationError', (cause) => (
          <Error message={cause['message']} />
        ))
        .onSuccess((users) => <List users={users} />)
        .render()}
    </section>
  );
}
