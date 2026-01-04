import EffectForm from './features/form';
import UserList from './features/user-list';
import { ThemeProvider } from './providers/theme-provider';

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="theme-preference">
      <main className="flex min-h-screen flex-col items-baseline p-3 antialiased">
        <h1 className="pl-3 text-2xl leading-loose font-semibold">
          Effect Form Demo
        </h1>
        <div className="flex w-full flex-col gap-3 lg:flex-row">
          <EffectForm />
          <UserList />
        </div>
      </main>
    </ThemeProvider>
  );
}
