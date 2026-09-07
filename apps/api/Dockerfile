FROM node:22-alpine AS builder

WORKDIR /repo

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json

RUN npm ci --workspace @itemforge/api --include-workspace-root

COPY apps/api apps/api
RUN npm run build --workspace @itemforge/api

FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /repo/node_modules ./node_modules
COPY --from=builder /repo/apps/api/package.json ./package.json
COPY --from=builder /repo/apps/api/dist ./dist

EXPOSE 4000

CMD ["node", "dist/server.js"]
