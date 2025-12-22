import { Result, useAtomValue } from "@effect-atom/atom-react";
import { usersAtom } from "@/lib/api/services";
import { Cause } from "effect";

export default function UserList() {
  const result = useAtomValue(usersAtom);

  return (
    <section>
      <h1>User List</h1>
      {Result.match(result, {
        onInitial: () => <p>Loading...</p>,
        onFailure: (failure) => <p>Error: {Cause.pretty(failure.cause)}</p>,
        onSuccess: (success) => (
          <ul>
            {success.value.map((user) => (
              <li key={user.id}>
                {user.name} ({user.username}) - {user.email}
              </li>
            ))}
          </ul>
        ),
      })}
    </section>
  );
}
