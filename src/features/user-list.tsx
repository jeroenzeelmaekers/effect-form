import { Result, useAtomValue } from "@effect-atom/atom-react";
import { optimisticUsersAtom } from "@/lib/api/services";
import { Cause, Schema } from "effect";
import type { User } from "@/models/user";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type User = Schema.Schema.Type<typeof User>;

interface ItemProps {
  user: User;
}

function Item({ user }: ItemProps) {
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

interface ListProps {
  users: readonly User[];
}

function List({ users }: ListProps) {
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

export default function UserList() {
  const result = useAtomValue(optimisticUsersAtom);

  return (
    <section className="w-full max-w-md">
      <h2 className="text-xl font-semibold mb-4">Users</h2>
      {Result.match(result, {
        onInitial: () => <p className="text-muted-foreground">Loading...</p>,
        onFailure: (failure) => (
          <p className="text-destructive">
            Error: {Cause.pretty(failure.cause)}
          </p>
        ),
        onSuccess: (success) => <List users={success.value} />,
      })}
    </section>
  );
}
