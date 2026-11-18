# Effect form

A small React demo of an Effect-powered user list and creation form. The app
fetches users from a configurable HTTP API, validates submitted user details,
and uses optimistic updates while creating a user.

## What the app does

- The home page (`/`) displays a sortable user table loaded from `GET /users`.
- A client-side filter can search all fields or target `name:`, `username:`, and
  `email:`. Use `AND`, `OR`, parentheses, and `*` wildcards to combine terms.
  The current query is stored in the URL's `filter` parameter.
- The user creation form appears only when the PostHog
  `allow-user-creation` feature flag is enabled. It validates the form and
  temporarily adds the new user to the list while `POST /users` is in flight.
- The command center in the header opens with `⌘K` / `Ctrl+K`. It uses Anthropic
  to turn a natural-language request into user-list navigation and a filter.
  It requires `VITE_ANTHROPIC_API_KEY` and the Vite development proxy. The
  provided Docker/nginx setup does not proxy `/anthropic`, so the command center
  is not functional there without additional proxy configuration.
- `/about` is currently a placeholder page.

The default API URL in `.env.example` is JSONPlaceholder, a demo API. Point
`VITE_API_BASE_URL` at a compatible API for other environments. PostHog
settings control feature flags and analytics; without a configured key, the
creation form may not be enabled.

## Development

The project uses Vite+ (`vp`) for development and project commands. The Nix
flake currently defines a development shell for `aarch64-darwin` and provides
Node.js 26.13.1 and pnpm. `package.json` declares pnpm 12.16.1. The flake does
not explicitly provide Corepack.

With direnv and Nix installed, approve the repository's `.envrc` once to enter
the shell automatically:

```sh
direnv allow
```

Alternatively, enter the Nix shell from the repository root:

```sh
nix develop
```

Copy `.env.example` to `.env` and set the Vite variables you need. In
particular, set `VITE_ANTHROPIC_API_KEY` to enable the command center during
Vite development. Then install dependencies and start the app:

```sh
pnpm install --frozen-lockfile
vp dev
```

The `.envrc` adds `node_modules/.bin` to `PATH`, so after dependencies are
installed `vp` resolves to the project's Vite+ executable. Inside the Nix shell,
you can also use `pnpm exec vp`.

Useful project checks:

```sh
vp run build
vp test --project node
vp run test:browser
```

Install Playwright browsers if you plan to run browser tests:

```sh
pnpm exec playwright install chromium firefox webkit
```

Playwright uses its standard browser cache. The Nix shell does not start Docker
or the observability services; start those separately with `docker compose up`
if needed.

## Docker

### Build

```sh
docker build \
  --build-arg VITE_API_BASE_URL=/api \
  --build-arg VITE_OTLP_BASE_URL=/otlp \
  --build-arg VITE_PUBLIC_POSTHOG_KEY=<your-posthog-key> \
  --build-arg VITE_PUBLIC_POSTHOG_HOST=/ingest \
  -t effect-form .
```

### Run

```sh
docker run -p 80:80 -p 443:443/tcp -p 443:443/udp \
  -e API_URL=https://jsonplaceholder.typicode.com/ \
  -e API_HOST=jsonplaceholder.typicode.com \
  -e OTLP_URL=http://host.docker.internal:4318/ \
  -e POSTHOG_REGION=eu \
  effect-form
```

The app is available at `https://localhost` (accept the self-signed certificate
warning for local use). For production, mount real certificates and point the
runtime proxy variables at your API and telemetry services:

```sh
docker run -p 80:80 -p 443:443/tcp -p 443:443/udp \
  -v /path/to/certs:/etc/nginx/certs:ro \
  -e API_URL=https://api.example.com/ \
  -e API_HOST=api.example.com \
  -e OTLP_URL=http://otel-collector:4318/ \
  -e POSTHOG_REGION=eu \
  effect-form
```
