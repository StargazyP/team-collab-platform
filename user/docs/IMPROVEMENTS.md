# 프로젝트 추가·보완 제안

PROJECT.md, 코드 구조, CI, env, 스키마를 기준으로 정리한 개선 제안입니다.

---

## 1. 보안·인증

### 1.1 Middleware 추가 (우선 추천)

- **현재**: 보호가 필요한 경로(`/workspaces`, `/admin`, `/mypage` 등)는 각 페이지에서 `getServerUser()` 후 `redirect()` 처리.
- **보완**: `middleware.ts`에서 인증 여부를 한 곳에서 검사하고, 비인증 사용자는 `/login`으로 리다이렉트.
- **효과**: 보호 경로를 한곳에서 관리, 누락 방지, 엣지에서 빠른 차단.

```ts
// middleware.ts (프로젝트 루트)
// 인증 필요 경로: /workspaces, /admin, /mypage 등
// 쿠키 검증 후 next() 또는 redirect('/login')
```

### 1.2 회원가입(register) 쿠키 옵션 통일

- **현재**: `app/api/auth/login/route.ts`는 `getAuthCookieOptions()` 사용, `register/route.ts`는 쿠키 옵션을 하드코딩(sameSite: "none", secure: true).
- **보완**: register에서도 `getAuthCookieOptions()` 사용.
- **효과**: 개발/운영 환경에 맞는 sameSite·secure 일관 적용.

### 1.3 회원가입 JWT에 tokenVersion 포함 (선택)

- **현재**: 로그인 시에만 `tokenVersion`을 DB에 올리고 JWT에 `v` 포함. 회원가입 시 발급 JWT에는 `v` 없음.
- **보완**: 회원가입 직후에도 `tokenVersion`을 1로 설정하고 JWT에 `v` 포함.
- **효과**: 단일 세션 정책을 로그인/회원가입 모두에 동일하게 적용.

### 1.4 Rate Limiting

- **현재**: 로그인·회원가입·API에 rate limit 없음.
- **보완**: `next-rate-limit`, `@upstash/ratelimit` 등으로 로그인/회원가입·민감 API 제한.
- **효과**: 브루트포스·스팸 가입·API 남용 완화.

### 1.5 API 입력 검증 스키마

- **현재**: 이메일/비밀번호 등은 수동 체크만 있음. zod 등 스키마 검증 없음.
- **보완**: `zod`(또는 유사 라이브러리)로 로그인/회원가입/워크스페이스 생성 등 요청 body 스키마 정의 및 검증.
- **효과**: 잘못된/초과 입력 차단, 타입·에러 메시지 일관성.

---

## 2. 환경·설정

### 2.1 env.template 보완

- **현재**: LiveKit 관련 변수만 있음.
- **보완**: PROJECT.md에 나온 변수 모두 템플릿에 추가:
  - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
  - `JWT_SECRET`
  - `WS_PORT`, `NEXT_PUBLIC_WS_URL` (또는 `NEXT_PUBLIC_WS_HOST` / `NEXT_PUBLIC_WS_PORT`)
  - LiveKit 변수는 유지
- **효과**: 새 환경 세팅 시 누락 방지.

### 2.2 Health check에 DB 옵션

- **현재**: `GET /api/health`는 타임스탬프만 반환.
- **보완**: 쿼리 파라미터(예: `?db=1`)가 있으면 DB 연결 한 번 시도 후 성공/실패 반환 (선택).
- **효과**: Docker/오케스트레이션에서 “DB까지 준비된 상태” 확인 가능.

---

## 3. 품질·안정성

### 3.1 에러 바운더리

- **현재**: `app/error.tsx`, `app/global-error.tsx` 없음.
- **보완**: App Router용 `error.tsx`(세그먼트 단위), 필요 시 `global-error.tsx` 추가.
- **효과**: 예기치 않은 에러 시 빈 화면 대신 안내 UI, 로그 수집 연동 가능.

### 3.2 테스트

- **현재**: CI에서 `npm run lint`, `npm run build`만 실행. 테스트 스크립트/파일 없음.
- **보완**:
  - 단위 테스트: `Vitest` 또는 `Jest`로 `src/lib`(auth, sanitize, permissions 등) 일부 검증.
  - API 또는 E2E: 중요한 플로우(로그인, 워크스페이스 목록 등) 일부만이라도 추가.
- **효과**: 리팩터 시 회귀 방지, CI에서 “테스트 통과” 단계 의미 부여.

### 3.3 schema.sql 오타 수정

- **현재**: `messages` 테이블 인덱스 이름 `idex_createdAt`.
- **보완**: `idx_createdAt`로 수정 (신규 DB부터 적용, 기존 DB는 필요 시 `ALTER INDEX` 등으로 정리).

---

## 4. 운영·배포

### 4.1 CI/CD 배포 스크립트 정리

- **현재**: `ci-cd.yml` deploy 단계에서 `cd /path/to/your/project`, `npm run migrate` 등 placeholder 사용.
- **보완**: 실제 서버 경로, 사용하는 `docker-compose`/실행 명령, 마이그레이션 실행 방식(있는 경우) 반영.
- **효과**: push 시 배포가 실제 환경에 맞게 동작.

### 4.2 JWT 만료·갱신 정책

- **현재**: JWT 만료 1시간만 설정. 리프레시 토큰 없음.
- **보완**: (선택) 리프레시 토큰 도입 또는 “1시간 후 재로그인” 정책을 README/PROJECT.md에 명시.
- **효과**: 운영 시 “갑자기 로그아웃됨” 문의 대응 용이.

---

## 5. 기능·UX (요약)

- 자세한 기능 제안은 **docs/FEATURES_IDEAS.md** 참고.
- 우선 적용하기 좋은 것: 메시지 검색, TODO 수정 페이지, 다크 모드, 프로필 이미지 등.

---

## 우선순위 제안

| 순위 | 항목 | 난이도 | 비고 |
|------|------|--------|------|
| 1 | register 쿠키 옵션 통일 | 낮음 | 즉시 적용 가능 |
| 2 | env.template 보완 | 낮음 | 문서/온보딩 개선 |
| 3 | middleware 추가 | 중간 | 인증 정책 일원화 |
| 4 | app/error.tsx 추가 | 낮음 | UX·디버깅 개선 |
| 5 | API 입력 검증(zod 등) | 중간 | 보안·유지보수 |
| 6 | Rate limiting | 중간 | 보안 |
| 7 | Health + DB 체크 | 낮음 | 운영 |
| 8 | 테스트 도입 | 중~높음 | 품질·CI 의미 부여 |
| 9 | schema.sql 인덱스 이름 수정 | 낮음 | 유지보수 |
| 10 | CI 배포 경로/명령 정리 | 낮음 | 배포 안정성 |

원하는 방향(보안 강화 / 운영 안정화 / 기능 확장)에 맞춰 위 항목부터 단계적으로 적용하면 됩니다.
