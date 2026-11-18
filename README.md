# Effect Form Demo

A React user-management demo built with Effect, TanStack Router, and Vite+. The
home page loads users from JSONPlaceholder, displays them in a sortable table,
and supports filtering and an optional user-creation form.

## Features

- **User list:** loads user records from JSONPlaceholder (`GET /users`).
- **Filtering:** filter by `name`, `username`, or `email`; unqualified text
  searches all three fields. Use `AND`, `OR`, parentheses, and `*` wildcards,
  for example `(name:alice OR name:bob) AND email:*@example.com`. The filter is
  also reflected in the URL.
- **User creation:** shown only when the PostHog `allow-user-creation` feature
  flag is enabled. The form validates name, username, email, and language, and
  adds a temporary row optimistically. JSONPlaceholder is a demo API and does
  not durably save created users; a created row should not be expected to
  survive a reload.
- **Command center:** open with **⌘K** on macOS or **Ctrl+K** elsewhere, then
  describe which users to find in natural language. The assistant uses
  Anthropic to navigate to the list and apply a filter. Configure
  `VITE_ANTHROPIC_API_KEY` for this in development. The provided production
  Nginx configuration does not proxy `/anthropic`, so this feature is not
  available in the supplied Docker deployment.
- **Debug and observability:** the account menu offers simulation mode (which
  injects latency and request failures) and OpenTelemetry tracing. Changing
  either setting reloads the app. Traces and logs are sent to the configured
  OTLP endpoint when tracing is enabled.
- **Privacy:** PostHog analytics starts opted out. The cookie banner lets users
  grant or decline consent before events are captured.

## Development

The project pins `pnpm@12.16.1` in `package.json`. Its Nix development shell
provides Node.js 26.13.1 and pnpm; `flake.nix` currently defines that shell only
for `aarch64-darwin` (Apple Silicon macOS). If using direnv, approve the checked
in `.envrc` once:

```sh
direnv allow
```

Alternatively, enter the Nix shell from the repository root:

```sh
nix develop
```

The shell does not start Docker or observability services. Create a local env
file and adjust values for your setup:

```sh
cp .env.example .env
```

For local Vite development, the most relevant settings are:

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | User API base URL; `.env.example` defaults to JSONPlaceholder. |
| `VITE_OTLP_BASE_URL` | OTLP endpoint for tracing; defaults to `/otlp` in the app config. |
| `VITE_PUBLIC_POSTHOG_KEY` | Public PostHog project key (needed for feature flags and analytics). |
| `VITE_PUBLIC_POSTHOG_HOST` | PostHog API host. |
| `VITE_ANTHROPIC_API_KEY` | API key used by Vite's development `/anthropic` proxy. |
| `VITE_APP_VERSION` | Application version metadata. |

Install from the lockfile and start the dev server:

```sh
pnpm install --frozen-lockfile
vp dev
```

The Vite development server proxies `/api`, `/otlp`, `/ingest`, and
`/anthropic`. The app and its API/runtime services are composed through the
Effect runtime in `src/infrastructure/runtime.ts`.

### Checks

```sh
vp run build
vp run test
vp run test:browser
vp lint
```

Browser tests use Playwright. Install browsers if needed:

```sh
pnpm exec playwright install chromium firefox webkit
```

## Docker

Build-time `VITE_*` settings are compiled into the static app. For example:

```sh
docker build \
  --build-arg VITE_API_BASE_URL=/api \
  --build-arg VITE_OTLP_BASE_URL=/otlp \
  --build-arg VITE_PUBLIC_POSTHOG_KEY=<your-posthog-key> \
  --build-arg VITE_PUBLIC_POSTHOG_HOST=/ingest \
  -t effect-form .
```

Run the container with runtime proxy destinations:

```sh
docker run -p 80:80 -p 443:443/tcp -p 443:443/udp \
  -e API_URL=https://jsonplaceholder.typicode.com/ \
  -e API_HOST=jsonplaceholder.typicode.com \
  -e OTLP_URL=http://host.docker.internal:4318/ \
  -e POSTHOG_REGION=eu \
  effect-form
```

Open <https://localhost> and accept the self-signed certificate warning. The
container's Nginx configuration proxies `/api`, `/otlp`, and `/ingest`; unlike
the Vite development server, it does not proxy `/anthropic`. The Dockerfile
also does not accept or configure an Anthropic key, so do not expect the AI
command center to work in this deployment without separately configuring an
appropriate proxy.

For production, mount real TLS certificates and provide the matching API,
OTLP, and PostHog runtime settings:

```sh
docker run -p 80:80 -p 443:443/tcp -p 443:443/udp \
  -v /path/to/certs:/etc/nginx/certs:ro \
  -e API_URL=https://api.example.com/ \
  -e API_HOST=api.example.com \
  -e OTLP_URL=http://otel-collector:4318/ \
  -e POSTHOG_REGION=eu \
  effect-form
```

The `docker-compose.yaml` file starts the local observability stack
(OpenTelemetry Collector, Tempo, Loki, and Grafana) separately; it does not
start the app. Run `docker compose up` to start the services. Grafana is
available at <http://localhost:3001> when the compose services are running.
