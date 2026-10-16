# syntax=docker/dockerfile:1

FROM node:24-alpine AS build

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

WORKDIR /workspace

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json

RUN pnpm install --frozen-lockfile --filter @moon/api...

COPY apps/api apps/api

RUN pnpm --filter @moon/api build \
  && pnpm --filter @moon/api --prod deploy --legacy /opt/moon-api

FROM node:24-alpine AS runtime

ENV NODE_ENV=production

WORKDIR /app

COPY --from=build /opt/moon-api ./

USER node

EXPOSE 8080

CMD ["node", "dist/main.js"]
