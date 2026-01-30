#!/bin/bash
set -e

#####################################
# Environment
#####################################
ENVIRONMENT=production
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"

echo "🚀 Starting deployment for $ENVIRONMENT environment..."

#####################################
# env 파일 확인
#####################################
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Error: $ENV_FILE not found"
  exit 1
fi

#####################################
# 환경 변수 로드
#####################################
set -a
source "$ENV_FILE"
set +a

#####################################
# Docker / Compose v2 체크
#####################################
if ! command -v docker &>/dev/null; then
  echo "❌ Docker is not installed"
  exit 1
fi

if ! docker compose version &>/dev/null; then
  echo "❌ Docker Compose v2 is not available"
  exit 1
fi

#####################################
# Docker Registry 로그인 체크
#####################################
if ! docker info | grep -q "Username:"; then
  echo "❌ Docker registry login required"
  echo "👉 Run: docker login"
  exit 1
fi

#####################################
# 최신 이미지 Pull
#####################################
echo "📦 Pulling latest images..."
docker compose -f "$COMPOSE_FILE" pull

#####################################
# 기존 컨테이너 종료
#####################################
echo "🛑 Stopping existing containers..."
docker compose -f "$COMPOSE_FILE" down

#####################################
# 컨테이너 시작
#####################################
echo "🚀 Starting containers..."
docker compose -f "$COMPOSE_FILE" up -d

#####################################
# Health Check 대기
#####################################
echo "⏳ Waiting for services to be healthy..."

until docker compose -f "$COMPOSE_FILE" ps | grep -q "(healthy)"; do
  sleep 3
done

echo "🏥 All services are healthy"
docker compose -f "$COMPOSE_FILE" ps

#####################################
# DB 마이그레이션 (선택)
#####################################
read -p "Run database migrations? (y/n) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "📊 Waiting for MySQL to be ready..."

  docker compose -f "$COMPOSE_FILE" exec -T mysql \
    sh -c 'until mysqladmin ping -h "$DB_HOST" --silent; do sleep 2; done'

  echo "📊 Running database migrations..."

  docker compose -f "$COMPOSE_FILE" exec -T mysql \
    mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" \
    < database/migrations/create_service_tables.sql || true
fi

#####################################
# Docker 이미지 정리 (안전)
#####################################
echo "🧹 Cleaning up unused Docker images..."
docker image prune -f

#####################################
# 완료
#####################################
echo "✅ Deployment completed successfully!"
echo "📝 Application is running at http://localhost:${APP_PORT:-3008}"

#####################################
# 로그 확인
#####################################
read -p "Show container logs? (y/n) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
  docker compose -f "$COMPOSE_FILE" logs -f
fi
