# Docker 배포 가이드

이 프로젝트를 Docker를 사용하여 배포하는 방법을 설명합니다.

## 📋 사전 요구사항

- Docker 20.10 이상
- Docker Compose 2.0 이상
- 최소 2GB RAM
- 최소 10GB 디스크 공간

## 🚀 빠른 시작

### 1. 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 열어서 다음 값들을 설정하세요:

```env
DB_HOST=mysql
DB_USER=user
DB_PASSWORD=your-secure-password
DB_NAME=user
DB_PORT=3306
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
APP_PORT=3008
```

**⚠️ 중요**: `JWT_SECRET`은 반드시 강력한 비밀번호로 변경하세요 (최소 32자).

### 2. Docker Compose로 실행

```bash
# 개발 환경
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 중지
docker-compose down
```

### 3. 데이터베이스 마이그레이션

컨테이너가 실행된 후, 데이터베이스 마이그레이션을 실행하세요:

```bash
# 마이그레이션 파일 실행
docker-compose exec mysql mysql -uuser -ppassword user < database/migrations/create_service_tables.sql
```

또는 MySQL 클라이언트로 직접 접속:

```bash
docker-compose exec mysql mysql -uuser -ppassword user
```

## 🐳 Docker 명령어

### 이미지 빌드

```bash
# 로컬 빌드
docker build -t user-app:latest .

# 특정 태그로 빌드
docker build -t user-app:v1.0.0 .
```

### 컨테이너 실행

```bash
# 단일 컨테이너 실행
docker run -d \
  --name user-app \
  -p 3008:3000 \
  --env-file .env \
  user-app:latest
```

### 로그 확인

```bash
# 모든 서비스 로그
docker-compose logs -f

# 특정 서비스 로그
docker-compose logs -f app
docker-compose logs -f mysql
```

### 컨테이너 상태 확인

```bash
# 실행 중인 컨테이너 확인
docker-compose ps

# 리소스 사용량 확인
docker stats
```

### 컨테이너 재시작

```bash
# 모든 서비스 재시작
docker-compose restart

# 특정 서비스만 재시작
docker-compose restart app
```

### 데이터베이스 백업

```bash
# 백업
docker-compose exec mysql mysqldump -uuser -ppassword user > backup_$(date +%Y%m%d_%H%M%S).sql

# 복원
docker-compose exec -T mysql mysql -uuser -ppassword user < backup.sql
```

## 🔧 프로덕션 배포

### 1. 배포 스크립트 사용

```bash
chmod +x deploy.sh
./deploy.sh production
```

### 2. 수동 배포

```bash
# 최신 이미지 가져오기
docker-compose pull

# 컨테이너 재빌드 및 재시작
docker-compose up -d --build

# 마이그레이션 실행
docker-compose exec -T mysql mysql -uuser -ppassword user < database/migrations/create_service_tables.sql
```

## 🔒 보안 설정

### 1. 환경 변수 보호

- `.env` 파일을 절대 Git에 커밋하지 마세요
- 프로덕션에서는 Docker Secrets 또는 환경 변수 관리 도구 사용

### 2. 방화벽 설정

```bash
# 필요한 포트만 열기
sudo ufw allow 3008/tcp
sudo ufw allow 22/tcp  # SSH
sudo ufw enable
```

### 3. SSL/TLS 설정 (Nginx Reverse Proxy)

Nginx를 사용하여 HTTPS를 설정하는 것을 권장합니다:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3008;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📊 모니터링

### Health Check

```bash
# 애플리케이션 헬스 체크
curl http://localhost:3008/api/health

# Docker 헬스 체크 상태
docker-compose ps
```

### 리소스 모니터링

```bash
# 실시간 리소스 사용량
docker stats

# 디스크 사용량
docker system df
```

## 🐛 문제 해결

### 컨테이너가 시작되지 않음

```bash
# 로그 확인
docker-compose logs app

# 컨테이너 상태 확인
docker-compose ps
```

### 데이터베이스 연결 오류

```bash
# MySQL 컨테이너 상태 확인
docker-compose ps mysql

# MySQL 로그 확인
docker-compose logs mysql

# MySQL에 직접 접속 테스트
docker-compose exec mysql mysql -uuser -ppassword user
```

### 포트 충돌

```bash
# 포트 사용 중인 프로세스 확인
sudo lsof -i :3008
sudo lsof -i :3306

# docker-compose.yml에서 포트 변경
```

### 볼륨 문제

```bash
# 볼륨 확인
docker volume ls

# 볼륨 삭제 (주의: 데이터 손실)
docker volume rm user_mysql_data
```

## 🔄 CI/CD 설정

GitHub Actions를 사용한 자동 배포는 `.github/workflows/ci-cd.yml` 파일을 참조하세요.

필요한 GitHub Secrets:
- `SERVER_HOST`: 서버 IP 주소
- `SERVER_USER`: SSH 사용자명
- `SERVER_SSH_KEY`: SSH 개인 키
- `SERVER_PORT`: SSH 포트 (기본값: 22)

## 📝 추가 참고사항

- 프로덕션 환경에서는 `docker-compose.prod.yml` 같은 별도 파일 사용 권장
- 데이터베이스는 정기적으로 백업하세요
- 로그 로테이션 설정을 고려하세요
- 모니터링 도구 (Prometheus, Grafana) 통합 고려
