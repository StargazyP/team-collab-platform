# ===== Builder =====
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build


# ===== Runner =====
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# ✅ node_modules 복사 (핵심)
COPY --from=builder /app/node_modules ./node_modules

# standalone 서버
COPY --from=builder /app/.next/standalone ./

# static 파일
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]

