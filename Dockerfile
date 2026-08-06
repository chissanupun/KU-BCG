# Multi-stage: build static Next export, serve with Nginx.
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .
# Empty string = same-origin relative API URLs (never localhost fallback).
ENV NEXT_PUBLIC_API_URL=
RUN npm run build \
  && test -d out \
  && ! grep -R "localhost:8000" out/_next/static >/dev/null 2>&1

FROM nginx:1.27-alpine AS runtime
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/out /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1/healthz || exit 1
CMD ["nginx", "-g", "daemon off;"]
