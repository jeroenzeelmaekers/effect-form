import { createFileRoute } from "@tanstack/react-router";

/** The about route (`/about`). */
export const Route = createFileRoute("/about")({
  component: About,
});

export function About() {
  return (
    <section className="mx-auto max-w-3xl space-y-8 p-6">
      <header className="space-y-2">
        <h1 className="text-2xl leading-loose font-semibold">
          About Effect Form
        </h1>
        <p className="text-muted-foreground">
          A small user-management app that demonstrates typed forms, reactive
          data, and Effect-powered services in a React application.
        </p>
      </header>

      <section aria-labelledby="features-heading" className="space-y-3">
        <h2 id="features-heading" className="text-xl font-semibold">
          What you can do
        </h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            Browse and sort users, then filter them by name, username, or email.
            Filters support free text, wildcards, AND/OR operators, and
            grouping.
          </li>
          <li>
            Create users with a validated form when the
            <code className="px-1">allow-user-creation</code> feature flag is
            enabled.
          </li>
          <li>
            Use the command center to describe which users you want to find; it
            can navigate to the list and apply a filter. AI requests require an
            Anthropic API key to be configured.
          </li>
        </ul>
      </section>

      <section aria-labelledby="built-with-heading" className="space-y-3">
        <h2 id="built-with-heading" className="text-xl font-semibold">
          How it works
        </h2>
        <p>
          User and command features are composed from shared Effect services,
          with API access provided through a common HTTP client. Optional debug
          settings can simulate request latency and failures or enable
          telemetry.
        </p>
      </section>

      <a className="text-primary underline underline-offset-4" href="/">
        Explore the app
      </a>
    </section>
  );
}
