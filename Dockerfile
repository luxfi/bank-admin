# Build the SPA, then serve it with a tiny zero-dep Node static server.
# No nginx / caddy (Hanzo stack rule). Single-arch linux/amd64 (DOKS).
FROM node:22-alpine AS builder
WORKDIR /src
RUN corepack enable
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile || pnpm install
COPY . .
# Bake the production config into the static bundle (Vite reads VITE_* at build).
# Live data source binds bankd; the sandbox mirror remains the graceful fallback.
ENV VITE_DATA_SOURCE=live
ENV VITE_BANK_API_URL=https://api.lux.financial
RUN pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=builder /src/dist ./dist
COPY --from=builder /src/serve.mjs ./serve.mjs
EXPOSE 3000
CMD ["node", "serve.mjs"]
