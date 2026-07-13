FROM node:22-slim AS build
WORKDIR /app
# Install build tools for native dependencies (better-sqlite3).
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run typecheck && npm test

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
# better-sqlite3 builds from source when no prebuilt binary matches.
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/src ./src
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/tsconfig.json ./
COPY --from=build /app/public ./public
COPY --from=build /app/slack ./slack
COPY --from=build /app/docs ./docs
RUN npm i -g tsx
# HTTP mode for deployment (no SLACK_APP_TOKEN → events over HTTP).
EXPOSE 3000
CMD ["tsx", "src/app.ts"]
