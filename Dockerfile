FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json vitest.config.ts ./
COPY src ./src
RUN npm run build
RUN npm prune --omit=dev

FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json README.md ./

EXPOSE 3000

CMD ["sh", "-c", "node dist/cli.js --transport http --port ${PORT:-3000} --host 0.0.0.0"]
