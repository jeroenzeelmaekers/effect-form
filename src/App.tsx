import EffectForm from "./features/form";
import UserList from "./features/user-list";
import { ThemeProvider } from "./providers/theme-provider";

export function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="effect-form-theme">
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <EffectForm />
          <UserList />
        </div>
      </main>
    </ThemeProvider>
  );
}

export default App;
