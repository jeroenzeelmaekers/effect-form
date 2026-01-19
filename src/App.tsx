import EffectForm from './features/form';
import UserList from './features/user-list';
import { ThemeProvider } from './providers/theme-provider';
import { PostHogProvider, useFeatureFlagEnabled } from 'posthog-js/react';

const options = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
  defaults: '2025-11-30',
} as const;

export default function App() {
  const userCreationFlag = useFeatureFlagEnabled('allow-user-creation');
  return (
    <PostHogProvider
      apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
      options={options}>
      <ThemeProvider defaultTheme="system" storageKey="theme-preference">
        <main className="flex min-h-screen flex-col items-baseline p-3 antialiased">
          <h1 className="pl-3 text-2xl leading-loose font-semibold">
            Effect Form Demo
          </h1>
          <div className="flex w-full flex-col gap-3 lg:flex-row">
            {userCreationFlag && <EffectForm />}
            <UserList />
          </div>
        </main>
      </ThemeProvider>
    </PostHogProvider>
  );
}
