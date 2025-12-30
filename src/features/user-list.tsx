import { Result, useAtomValue } from "@effect-atom/atom-react";
import { optimisticUsersAtom } from "@/lib/api/services";
import { Schema } from "effect";
import type { User } from "@/models/user";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

// Define User type from schema
type User = Schema.Schema.Type<typeof User>;

// Single list item card
function Item({ user }: { user: User }) {
  const isOptimistic = user.id < 0;

  return (
    <li
      className={cn("p-3 rounded-lg border flex justify-between flex-row", {
        "bg-muted/50 border-dashed opacity-70": isOptimistic,
        "bg-card border-border": !isOptimistic,
      })}
    >
      <div className="flex-col gap-3">
        <div className="font-medium">{user.name}</div>
        <div className="text-sm text-muted-foreground">
          @{user.username} - {user.email}
        </div>
      </div>

      <div>
        {isOptimistic && (
          <Loader2 className="ml-2 inline-block h-4 w-4 animate-spin text-muted-foreground" />
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
    <span id="error-container" className="text-red-500 text-sm">
      {message}
    </span>
  );
}

// Main UserList component
export default function UserList() {
  const result = useAtomValue(optimisticUsersAtom);

  return (
    <section className="w-full max-w-md">
      <h2 className="text-xl font-semibold mb-4">Users</h2>
      {Result.builder(result)
        .onInitial(() => <p className="text-muted-foreground">Loading...</p>)
        .onErrorTag("UserNotFound", (cause) => (
          <Error message={cause["message"]} />
        ))
        .onErrorTag("NetworkError", (cause) => (
          <Error message={cause["message"]} />
        ))
        .onErrorTag("ValidationError", (cause) => (
          <Error message={cause["message"]} />
        ))
        .onSuccess((users) => <List users={users} />)
        .render()}
    </section>
  );
}
