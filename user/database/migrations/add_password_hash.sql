-- users 테이블에 password_hash 컬럼 추가
ALTER TABLE users 
ADD COLUMN password_hash VARCHAR(255) NOT NULL AFTER email;

-- 기존 사용자들을 위한 임시 비밀번호 해시 (실제로는 회원가입 시 설정)
-- 주의: 프로덕션에서는 이 부분을 제거하고 회원가입 API를 통해 비밀번호를 설정해야 합니다
