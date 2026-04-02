# Effect form

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
