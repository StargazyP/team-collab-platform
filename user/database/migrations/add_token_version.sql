-- 단일 세션: 다른 환경에서 로그인 시 기존 토큰 무효화용
-- users 테이블에 tokenVersion 컬럼 추가
ALTER TABLE users
ADD COLUMN tokenVersion BIGINT NOT NULL DEFAULT 0;
