import EffectForm from './features/form';
import UserList from './features/user-list';
import { ThemeProvider } from './providers/theme-provider';

export function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="effect-form-theme">
      <main className="flex min-h-screen items-baseline justify-center-safe p-8">
        <div className="flex flex-col items-start gap-8 lg:flex-row">
          <EffectForm />
          <UserList />
        </div>
      </main>
    </ThemeProvider>
  );
}

export default App;
