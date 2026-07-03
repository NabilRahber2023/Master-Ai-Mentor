# Frontend multistage build for Next.js
FROM node:20-alpine AS deps
WORKDIR /app
# Pin pnpm to 9.x: matches the repo's lockfileVersion 9.0 and is compatible with
# Node 20. pnpm@latest (10.x) requires Node >=22.13 and fails on node:sqlite.
RUN corepack enable && corepack prepare pnpm@9 --activate
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile --offline || pnpm install

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# BACKEND_URL is baked into the Next.js rewrites at build time and must point at
# the backend reachable from the running frontend container (e.g. the compose
# service name http://api:8000). It is required — the build fails fast if unset
# so images are never shipped silently proxying to localhost.
ARG BACKEND_URL
ENV BACKEND_URL=${BACKEND_URL}
RUN if [ -z "$BACKEND_URL" ]; then \
      echo "ERROR: BACKEND_URL build arg is required (e.g. --build-arg BACKEND_URL=http://api:8000)"; \
      exit 1; \
    fi && \
    echo "Using BACKEND_URL=${BACKEND_URL}" && pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@9 --activate
COPY --from=builder /app .
EXPOSE 3000
CMD ["pnpm","start","--","-p","3000"]
