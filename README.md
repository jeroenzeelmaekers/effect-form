# Effect Form Demo

A small React application demonstrating Effect-based data access and user
management. The home page displays a user list; a user creation form appears
when the PostHog `allow-user-creation` feature flag is enabled. The form
validates user details and updates the list optimistically. The header's
command center can use Anthropic to navigate to and filter the user list.

The account menu also includes debug controls for simulating API latency/errors
and enabling OpenTelemetry. The app uses JSONPlaceholder as its example API.

## Development

### Requirements and setup

The project uses Vite+ (`vp`) and pnpm. `package.json` pins pnpm to `12.16.1`.
The Nix flake currently provides Node.js `26.13.1` on `aarch64-darwin`; on other
platforms, use a compatible Node.js installation and Vite+ tooling.

With direnv and Nix installed, approve the repository environment once:

```sh
direnv allow
```

Alternatively, enter the Nix development shell from the repository root:

```sh
nix develop
```

In a shell entered directly with `nix develop`, use `pnpm install --frozen-lockfile` to install dependencies. Prefix Vite+ commands with `pnpm exec` (for example, `pnpm exec vp dev`).


Copy the sample environment file and configure any optional services you
intend to use:

```sh
cp .env.example .env
```

With direnv enabled, install dependencies with pnpm, then run the development server:

```sh
pnpm install --frozen-lockfile
vp dev
```

Open the local URL printed by Vite. `.env.example` lists the available Vite
environment variables. In particular:

- `VITE_API_BASE_URL` sets the API base URL. The example uses JSONPlaceholder
  directly; set it to `/api` to use the development server's JSONPlaceholder
  proxy.
- `VITE_PUBLIC_POSTHOG_KEY` and `VITE_PUBLIC_POSTHOG_HOST` configure PostHog.
  To show the creation form, configure the `allow-user-creation` feature flag
  for the app in PostHog.
- `VITE_ANTHROPIC_API_KEY` enables AI requests in the command center. The
  development server proxies these requests to Anthropic; without a key, AI
  requests will not succeed.
- `VITE_OTLP_BASE_URL` configures the OpenTelemetry collector endpoint when
  tracing is enabled.

Simulation and tracing are off by default. Toggle them in the account menu's
**Debug** section; the settings are saved in local storage and take effect
following a page reload.

### Development commands

Run project scripts through Vite+:

```sh
vp run build          # type-check and create a production build
vp lint               # lint the project
vp test --project node # run Node-environment tests
vp run test:browser   # run browser tests (Playwright)
vp run test:coverage  # run coverage tests
```

For browser tests, install the Playwright browsers if needed:

```sh
pnpm exec playwright install chromium firefox webkit
```

### Optional observability stack

The Nix development shell does not start Docker services. To run the local
OpenTelemetry collector, Tempo, Loki, and Grafana stack:

```sh
docker compose up
```

Grafana is available at <http://localhost:3001>; the collector accepts OTLP
HTTP on port `4318`.

## Docker

Build the production image, supplying the Vite-time API, telemetry, and
PostHog settings as build arguments:

```sh
docker build \
  --build-arg VITE_API_BASE_URL=/api \
  --build-arg VITE_OTLP_BASE_URL=/otlp \
  --build-arg VITE_PUBLIC_POSTHOG_KEY=<your-posthog-key> \
  --build-arg VITE_PUBLIC_POSTHOG_HOST=/ingest \
  -t effect-form .
```

Run it with the API and telemetry upstreams configured at container runtime:

```sh
docker run -p 80:80 -p 443:443/tcp -p 443:443/udp \
  -e API_URL=https://jsonplaceholder.typicode.com/ \
  -e API_HOST=jsonplaceholder.typicode.com \
  -e OTLP_URL=http://host.docker.internal:4318/ \
  -e POSTHOG_REGION=eu \
  effect-form
```

The app is served at <https://localhost> with a self-signed certificate. For
production, mount your TLS certificates at `/etc/nginx/certs` and set the
runtime upstream variables for your deployment:

```sh
docker run -p 80:80 -p 443:443/tcp -p 443:443/udp \
  -v /path/to/certs:/etc/nginx/certs:ro \
  -e API_URL=https://api.example.com/ \
  -e API_HOST=api.example.com \
  -e OTLP_URL=http://otel-collector:4318/ \
  -e POSTHOG_REGION=eu \
  effect-form
```

The Docker/nginx setup proxies API, OTLP, and PostHog traffic, but does not
proxy Anthropic requests. Therefore, the command center's AI requests are only
available when running the Vite development server with
`VITE_ANTHROPIC_API_KEY` configured.
