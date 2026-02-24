# 프로젝트 개요

Next.js 기반의 **협업·커뮤니케이션 웹앱**입니다. 워크스페이스 단위로 채널, DM, TODO를 관리하고, LiveKit 기반 음성/영상 통화(허들)와 실시간 알림을 지원합니다.

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router), React 19 |
| 스타일 | Tailwind CSS 4 |
| DB | MySQL 8 (mysql2) |
| 인증 | JWT (HttpOnly 쿠키) |
| 실시간 | WebSocket (채널 메시지, 알림), LiveKit (음성/영상) |
| 배포 | Docker (standalone), PM2 (ecosystem.config.js) |

---

## 디렉터리 구조

```
user/
├── app/                    # Next.js App Router (페이지·API)
│   ├── api/                # API 라우트
│   │   ├── auth/           # 로그인, 로그아웃, 회원가입, me, ws-token
│   │   ├── workspaces/     # 워크스페이스 CRUD, 채널, 멤버, DM
│   │   ├── channels/       # 채널 삭제, 메시지
│   │   ├── todos/          # TODO CRUD, 담당자 지정
│   │   ├── notifications/  # 알림 조회
│   │   ├── livekit/        # LiveKit 토큰 발급
│   │   ├── users/          # 사용자 목록, 수정, 삭제
│   │   └── health/
│   ├── login, register, mypage, admin/
│   └── workspaces/         # 워크스페이스·채널·DM·TODO 페이지
├── src/
│   ├── components/         # UI 컴포넌트
│   │   ├── HuddleRoom, HuddleControlBar, HuddleLayoutWrapper  # 통화
│   │   ├── WorkspaceSidebar, WorkspaceHeader                  # 레이아웃
│   │   ├── MessageInput, RichTextEditor                       # 메시지·TODO 입력
│   │   └── NotificationBell
│   ├── contexts/           # HuddleLayoutContext (허들 입장/퇴장 상태)
│   ├── domain/             # 도메인 타입 (Todo, Workspace) — domain/index.ts
│   ├── hooks/              # useChannelWs, useNotificationWs
│   ├── lib/                # auth, db, cookie, sanitize, permissions
│   ├── services/           # DB·비즈니스 로직
│   │   ├── workspace, channel, dm, message, todo, notification
│   │   └── (user.service는 app/api에서 참조)
│   └── ws/                 # WebSocket 서버 (workspace-ws.ts)
├── middleware.ts           # (존재 시) 인증·라우트 보호
├── livekit.yaml            # LiveKit 서버 설정
├── docker-compose-dev.yml  # MySQL, LiveKit
├── docker-compose.prod.yml
├── env.template            # LIVEKIT_* 등
└── PROJECT.md              # 본 문서
```

- **라우트**: 루트 `app/` 사용. `@/*`는 `src/*`로 해석됩니다.
- **페이지**: `/` → 로그인 여부에 따라 `/login` 또는 `/workspaces`로 리다이렉트. `/workspaces`, `/workspaces/[id]`, 채널/DM/TODO/멤버 하위 경로 제공.

---

## 주요 기능

### 1. 인증·사용자

- **회원가입** (`/register`), **로그인** (`/login`): JWT 발급 후 HttpOnly 쿠키에 저장.
- **역할**: `user` | `admin`. `/admin`은 admin만 접근.
- **마이페이지** (`/mypage`): 프로필·이름 수정 등.

### 2. 워크스페이스

- 워크스페이스 목록·생성·상세. 멤버만 접근 가능.
- **역할**: owner / admin / member. 방장(owner) 전용: 채널 삭제, 멤버 내보내기 등.

### 3. 채널·DM

- **채널**: 워크스페이스 내 공개 채널. 메시지 실시간 전송(WebSocket), 리치 텍스트(굵게, 목록, 인용 등), HTML 정제(sanitize).
- **DM**: 1:1 대화. 채널 목록에는 표시되지 않고, `dm-{userId1}-{userId2}` 형태로 관리.

### 4. TODO

- **상태**: 할 일(todo) / 진행 중(doing) / 완료(done). 칸반 형태 노드로 표시.
- **새글 작성**: 별도 페이지(`/workspaces/[id]/todos/new`)에서 제목 + 리치 에디터로 상세 작성.
- 목록에서 상세 내용은 HTML로 렌더링. 담당자 지정 API 존재.

### 5. 허들 (LiveKit)

- 워크스페이스 단위 음성/영상 통화. **입장** 시 해당 워크스페이스 루트에서 전체 화면, 채널/DM/TODO 등 다른 화면으로 이동 시 **PiP**로 표시.
- PiP에서 **말할 때** 마이크 음량 감지 후 Discord 스타일 **초록색 띠**로 표시.
- 카메라/마이크는 HTTPS 또는 localhost에서만 사용(브라우저 정책). 디바이스 선택·마이크/카메라 토글·통화 끄기 지원.

### 6. 알림

- WebSocket으로 실시간 알림. `NotificationBell`로 미확인 개수 표시 및 조회.

---

## 인증·권한

- **인증**: `getServerUser()`(서버·쿠키), `getUserFromRequest(req)`(API·헤더/쿠키)로 JWT 검증.
- **권한**: `src/lib/permissions.ts` — 워크스페이스 멤버 여부, 방장/역할, TODO 작성자/담당자 등. API에서 `isWorkspaceMember`, `isTodoCreator` 등으로 체크.

---

## 환경 변수

| 변수 | 설명 |
|------|------|
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | MySQL 연결 |
| `JWT_SECRET` | JWT 서명용 시크릿 |
| `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` | LiveKit (또는 셀프호스팅 시 해당 서버) |
| `WS_PORT` | WebSocket 서버 포트 (기본 8081) |
| `NEXT_PUBLIC_WS_URL` 또는 `NEXT_PUBLIC_WS_HOST` / `NEXT_PUBLIC_WS_PORT` | 클라이언트 WebSocket URL |

- 로컬 LiveKit: `LIVEKIT_URL=ws://127.0.0.1:7880` 등. `env.template` 참고.

---

## 실행 방법

### 로컬 개발

1. **MySQL·LiveKit** (선택):  
   `docker-compose -f docker-compose-dev.yml up -d`
2. **WebSocket 서버** (채널·알림용):  
   `npm run ws:dev`
3. **Next.js**:  
   `npm run dev`  
   - HTTPS 개발: `package.json`의 `dev` 스크립트에 experimental-https 사용 중.

### 빌드·실행

- `npm run build` → `npm run start`  
- Docker: `output: "standalone"` 기준 이미지 빌드 후 `docker-compose.prod.yml` 등으로 실행.

---

## API 요약

| 경로 | 메서드 | 설명 |
|------|--------|------|
| `/api/auth/login` | POST | 로그인, JWT 쿠키 설정 |
| `/api/auth/register` | POST | 회원가입 |
| `/api/auth/me` | GET | 현재 사용자 |
| `/api/auth/logout` | POST | 로그아웃 |
| `/api/workspaces` | GET, POST | 워크스페이스 목록·생성 |
| `/api/workspaces/[id]` | GET | 워크스페이스 상세 |
| `/api/workspaces/[id]/channels` | GET, POST | 채널 목록·생성 |
| `/api/workspaces/[id]/dm` | POST | DM 채널 생성/조회 |
| `/api/channels/[id]` | DELETE | 채널 삭제(방장) |
| `/api/channels/[id]/messages` | GET, POST | 메시지 목록·전송 |
| `/api/todos` | GET, POST | TODO 목록·생성 |
| `/api/todos/[id]` | PATCH, DELETE | TODO 수정·삭제 |
| `/api/notifications` | GET | 알림 목록 |
| `/api/livekit/token` | POST | LiveKit 입장 토큰 |

---

## 기타

- **리치 텍스트**: `MessageInput`(채널), `RichTextEditor`(TODO 새글). 허용 태그만 `sanitizeHtml`로 정제 후 저장·표시.
- **CI/CD**: `.github/workflows/ci-cd.yml` 에서 빌드·배포 파이프라인 정의 가능.
- **src 상세**: `src/README.md` 참고.
- **추가 기능 제안**: `docs/FEATURES_IDEAS.md` 참고.
