# syntax=docker/dockerfile:1

FROM node:24-alpine AS build

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

WORKDIR /workspace

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json

RUN pnpm install --frozen-lockfile --filter @moon/web...

COPY apps/web apps/web

RUN pnpm --filter @moon/web build

FROM nginxinc/nginx-unprivileged:1.29-alpine AS runtime

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/apps/web/dist/web/browser /usr/share/nginx/html

EXPOSE 8080
