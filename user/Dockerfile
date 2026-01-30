# ===== Builder =====
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ===== Runner (standalone) =====
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# standalone 서버
COPY --from=builder /app/.next/standalone ./

# static 파일
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
