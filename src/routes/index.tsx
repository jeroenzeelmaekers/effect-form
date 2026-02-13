import { createFileRoute } from "@tanstack/react-router";
import { useFeatureFlagEnabled } from "posthog-js/react";

import EffectForm from "@/domains/user/components/user-form";
import UserList from "@/domains/user/components/user-list";

export const Route = createFileRoute("/")({
  component: Index,
});

export default function Index() {
  const userCreationFlag = useFeatureFlagEnabled("allow-user-creation");
  return (
    <main className="flex min-h-screen flex-col items-baseline p-3 antialiased">
      <h1 className="pl-3 text-2xl leading-loose font-semibold">
        Effect Form Demo
      </h1>
      <div className="flex w-full flex-col gap-3 lg:flex-row">
        {userCreationFlag && <EffectForm />}
        <UserList />
      </div>
    </main>
  );
}
