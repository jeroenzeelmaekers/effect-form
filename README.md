# Effect form

## Development

The project uses direnv to load its Nix shell and add local binaries to `PATH`
when you enter the repository. After approving `.envrc` once, Node 24, the
pinned pnpm, and the project's Vite+ commands are available in your normal Zsh
session:

```sh
direnv allow
```

The shell provides Node.js 24 and Corepack. Corepack reads the pinned
`pnpm@10.18.0` version from `package.json`. `.envrc` uses direnv's `PATH_add`
to expose `node_modules/.bin`, so `vp` resolves to the project's Vite+ version
instead of a global one. To enter the Nix environment without direnv, run
`nix develop` from the repository root. In that shell, use `pnpm exec vp`
instead of bare `vp`.

Inside the shell, install dependencies from the lockfile and start the app:

```sh
pnpm install --frozen-lockfile
vp dev
```

Install the Playwright browsers if you plan to run browser tests:

```sh
pnpm exec playwright install chromium firefox webkit
```

Playwright uses its standard browser cache. The Nix shell does not start Docker
or the observability services; use `docker compose up` separately if you need
them.

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

App at `https://localhost` (accept self-signed cert warning in dev).

Mount real certs in production:

```sh
docker run -p 80:80 -p 443:443/tcp -p 443:443/udp \
  -v /path/to/certs:/etc/nginx/certs:ro \
  -e API_URL=https://api.example.com/ \
  -e API_HOST=api.example.com \
  -e OTLP_URL=http://otel-collector:4318/ \
  -e POSTHOG_REGION=eu \
  effect-form
```
