import EffectForm from './features/form';
import UserList from './features/user-list';
import { ThemeProvider } from './providers/theme-provider';

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="theme-preference">
      <main className="flex min-h-screen items-baseline p-4">
        <div className="flex w-full flex-col gap-4 lg:flex-row">
          <EffectForm />
          <UserList />
        </div>
      </main>
    </ThemeProvider>
  );
}
