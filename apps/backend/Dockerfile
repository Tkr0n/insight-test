FROM node:22-slim AS builder
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma/
RUN npx prisma generate
COPY tsconfig.json ./
COPY src ./src/
RUN npm run build

FROM node:22-slim
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
EXPOSE 3000
CMD ["node", "dist/server.js"]
