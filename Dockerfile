# --- Build stage ---
FROM oven/bun:1 AS build
WORKDIR /app

COPY bun.lock package.json ./
RUN bun install --frozen-lockfile

COPY . .

ARG VITE_API_BASE_URL
ARG VITE_OTLP_BASE_URL
ARG VITE_PUBLIC_POSTHOG_KEY
ARG VITE_PUBLIC_POSTHOG_HOST

RUN bun run build

# --- Serve stage ---
FROM nginx:1-alpine AS serve

RUN apk add --no-cache gettext openssl

COPY nginx.conf /etc/nginx/nginx.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

ENV API_URL=""
ENV API_HOST=""
ENV OTLP_URL=""
ENV POSTHOG_REGION=""

EXPOSE 80 443/tcp 443/udp

# Generate self-signed cert if none mounted, substitute env vars, start nginx
CMD ["/bin/sh", "-c", "\
  if [ ! -f /etc/nginx/certs/cert.pem ]; then \
    mkdir -p /etc/nginx/certs && \
    openssl req -x509 -nodes -days 365 \
      -newkey rsa:2048 \
      -keyout /etc/nginx/certs/key.pem \
      -out /etc/nginx/certs/cert.pem \
      -subj '/CN=localhost'; \
  fi && \
  envsubst '${API_URL} ${API_HOST} ${OTLP_URL} ${POSTHOG_REGION}' \
    < /etc/nginx/nginx.conf.template \
    > /etc/nginx/nginx.conf && \
  nginx -g 'daemon off;'"]
