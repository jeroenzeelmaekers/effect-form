import EffectForm from "./features/form";
import { ThemeProvider } from "./providers/theme-provider";

export function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="effect-form-theme">
      <main className="min-h-screen flex items-center justify-center">
        <EffectForm />
      </main>
    </ThemeProvider>
  );
}

export default App;
