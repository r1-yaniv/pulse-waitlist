# ---- build: compile the Vite frontend ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- runtime: Node serves dist/ + the /api routes ----
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY server ./server
COPY --from=build /app/dist ./dist
# Railway injects PORT; default matches docker-compose / local.
ENV PORT=8080
EXPOSE 8080
CMD ["node", "server/index.mjs"]
