# Plain static frontend (public/) + Express API (server/). No build step.
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY server ./server
COPY public ./public
# Railway injects PORT; default matches docker-compose / local.
ENV PORT=8080
EXPOSE 8080
CMD ["node", "server/index.mjs"]
