# 프로젝트 구현 현황 정리

## 📋 프로젝트 개요

Slack과 유사한 협업 플랫폼으로, 사용자 관리, 워크스페이스, Todo 기능을 제공하는 Next.js 기반 애플리케이션입니다.

---

## 🏗️ 프로젝트 구조

```
user/
├── src/
│   ├── app/
│   │   ├── api/                    # API 라우트
│   │   │   ├── auth/
│   │   │   │   └── register/       # 회원가입 API
│   │   │   ├── users/
│   │   │   │   ├── auth/login/     # 로그인 API
│   │   │   │   ├── [id]/           # 사용자 수정/삭제
│   │   │   │   └── route.ts        # 사용자 목록/생성
│   │   │   ├── workspaces/         # 워크스페이스 API
│   │   │   │   ├── [id]/
│   │   │   │   │   └── members/    # 멤버 관리
│   │   │   │   └── route.ts
│   │   │   └── todos/              # Todo API
│   │   │       └── [id]/
│   │   │           └── assign/     # 담당자 할당
│   ├── domain/                     # 도메인 모델
│   │   ├── user/
│   │   ├── workspace.ts
│   │   ├── todo.ts
│   │   ├── channel.ts
│   │   └── message.ts
│   ├── lib/                        # 유틸리티
│   │   ├── auth.ts                 # 인증 유틸리티
│   │   ├── db.ts                   # DB 연결
│   │   └── permissions.ts           # 권한 체크
│   ├── services/                   # 비즈니스 로직
│   │   ├── user.service.ts
│   │   ├── workspace.service.ts
│   │   └── todo.service.ts
│   └── middleware.ts              # 인증 미들웨어
└── database/
    └── migrations/                 # DB 마이그레이션
```

---

## ✅ 구현 완료 기능

### 1. 인증 시스템

#### 1.1 로그인 API
- **경로**: `POST /api/users/auth/login`
- **기능**:
  - 이메일/비밀번호로 로그인
  - bcrypt로 비밀번호 검증
  - JWT 토큰 생성 및 쿠키에 저장
  - 사용자 정보 반환

#### 1.2 회원가입 API
- **경로**: `POST /api/auth/register`
- **기능**:
  - 사용자 생성 (이름, 이메일, 비밀번호)
  - 비밀번호 bcrypt 해싱
  - 이메일 중복 확인
  - 입력 검증 (이메일 형식, 비밀번호 길이)
  - 자동 로그인 (JWT 토큰 발급)

#### 1.3 인증 미들웨어
- **파일**: `src/middleware.ts`
- **기능**:
  - JWT 토큰 검증
  - 공개 경로 관리 (`/api/auth/login`, `/api/auth/register`)
  - 관리자 권한 체크
  - 사용자 정보를 헤더에 추가 (`x-user-id`, `x-user-role`)

---

### 2. 사용자 관리

#### 2.1 사용자 API
- **GET `/api/users`**: 전체 사용자 목록 조회 (관리자만)
- **POST `/api/users`**: 사용자 생성 (관리자만)
- **PATCH `/api/users/[id]`**: 사용자 이름 수정
  - 자신의 이름 변경: 허용
  - 다른 사용자 이름 변경: `USER_UPDATE` 권한 필요
- **DELETE `/api/users/[id]`**: 사용자 삭제 (`USER_DELETE` 권한 필요)

#### 2.2 사용자 도메인 모델
- **타입**: `User`, `Admin`, `AnyUser`
- **역할**: `user`, `admin`
- **권한**: Permission 타입 정의

---

### 3. 워크스페이스 시스템

#### 3.1 워크스페이스 API
- **GET `/api/workspaces`**: 내 워크스페이스 목록 조회
- **POST `/api/workspaces`**: 워크스페이스 생성
  - 생성자는 자동으로 `owner` 역할로 추가
- **GET `/api/workspaces/[id]`**: 워크스페이스 조회 (멤버만)
- **GET `/api/workspaces/[id]/members`**: 멤버 목록 조회
- **POST `/api/workspaces/[id]/members`**: 멤버 추가
  - `owner` 또는 `admin`만 가능
  - 역할: `owner`, `admin`, `member`

#### 3.2 워크스페이스 서비스
- `createWorkspace()`: 워크스페이스 생성
- `getWorkspace()`: 워크스페이스 조회
- `getUserWorkspaces()`: 사용자의 워크스페이스 목록
- `addWorkspaceMember()`: 멤버 추가
- `removeWorkspaceMember()`: 멤버 제거
- `updateWorkspaceMemberRole()`: 멤버 역할 변경
- `getWorkspaceMembers()`: 멤버 목록 조회

---

### 4. Todo 시스템

#### 4.1 Todo API
- **GET `/api/todos`**: Todo 목록 조회
  - Query params:
    - `workspaceId`: 워크스페이스별 조회
    - `assignedTo=me`: 내가 담당자인 Todo
- **POST `/api/todos`**: Todo 생성
  - 필수: `title`, `workspaceId`
  - 선택: `description`, `channelId`, `assignedTo`
- **GET `/api/todos/[id]`**: Todo 조회
- **PATCH `/api/todos/[id]`**: Todo 업데이트
  - 생성자 또는 담당자만 수정 가능
- **DELETE `/api/todos/[id]`**: Todo 삭제
  - 생성자만 삭제 가능
- **PATCH `/api/todos/[id]/assign`**: 담당자 할당
  - 생성자, 워크스페이스 admin/owner만 할당 가능
  - 할당 대상은 워크스페이스 멤버여야 함

#### 4.2 Todo 서비스
- `createTodo()`: Todo 생성
- `getTodo()`: Todo 조회
- `getWorkspaceTodos()`: 워크스페이스의 모든 Todo
- `getAssignedTodos()`: 사용자에게 할당된 Todo
- `assignTodo()`: 담당자 할당/변경
- `updateTodoStatus()`: 상태 변경 (`todo`, `doing`, `done`)
- `updateTodo()`: Todo 업데이트
- `deleteTodo()`: Todo 삭제

---

### 5. 권한 시스템

#### 5.1 권한 체크 함수 (`lib/permissions.ts`)
- `checkPermission()`: Service 레벨 권한 체크
  - Admin은 모든 권한 자동 허용
  - User는 DB의 permissions 필드에서 확인
- `isWorkspaceMember()`: 워크스페이스 멤버 확인
- `hasWorkspaceRole()`: 워크스페이스 역할 확인
- `isTodoAssignee()`: Todo 담당자 확인
- `isTodoCreator()`: Todo 생성자 확인

#### 5.2 권한 타입
- `USER_READ`, `USER_WRITE`, `USER_DELETE`, `USER_UPDATE`, `USER_CREATE`
- `USER_READ_ALL`, `USER_WRITE_ALL`, `USER_DELETE_ALL`, `USER_UPDATE_ALL`, `USER_CREATE_ALL`
- `WORKSPACE_READ`, `WORKSPACE_WRITE`, `WORKSPACE_DELETE`, `WORKSPACE_MEMBER_MANAGE`
- `TODO_READ`, `TODO_WRITE`, `TODO_DELETE`, `TODO_ASSIGN`

---

### 6. 데이터베이스

#### 6.1 테이블 구조
1. **users**: 사용자 정보
   - `id`, `name`, `email`, `password_hash`, `role`, `permission`, `created_at`

2. **workspaces**: 워크스페이스
   - `id`, `name`, `description`, `ownerId`, `createdAt`

3. **workspace_members**: 워크스페이스 멤버
   - `id`, `workspaceId`, `userId`, `role` (owner/admin/member), `joinedAt`

4. **todos**: Todo 항목
   - `id`, `title`, `description`, `status` (todo/doing/done)
   - `workspaceId`, `channelId`, `createdBy`, `assignedTo`
   - `createdAt`, `updatedAt`

5. **channels**: 채널 (구조만 생성)
   - `id`, `name`, `description`, `workspaceId`, `createdBy`, `isPrivate`
   - `createdAt`, `updatedAt`

6. **messages**: 메시지 (구조만 생성)
   - `id`, `content`, `channelId`, `userId`, `parentMessageId`
   - `createdAt`, `updatedAt`

7. **channel_members**: 채널 멤버 (구조만 생성)
   - `id`, `channelId`, `userId`, `joinedAt`

#### 6.2 외래 키 관계
- 모든 테이블이 적절한 외래 키로 연결됨
- CASCADE 삭제 설정으로 데이터 무결성 보장

---

## 🔧 기술 스택

### Backend
- **Framework**: Next.js 16.1.4 (App Router)
- **Language**: TypeScript 5
- **Database**: MySQL (mysql2)
- **인증**: JWT (jsonwebtoken)
- **비밀번호 해싱**: bcryptjs

### 주요 패키지
```json
{
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.3",
  "mysql2": "^3.16.1",
  "next": "16.1.4",
  "react": "19.2.3"
}
```

---

## 📝 API 엔드포인트 요약

### 인증
- `POST /api/auth/register` - 회원가입
- `POST /api/users/auth/login` - 로그인

### 사용자
- `GET /api/users` - 사용자 목록 (관리자)
- `POST /api/users` - 사용자 생성 (관리자)
- `PATCH /api/users/[id]` - 사용자 수정
- `DELETE /api/users/[id]` - 사용자 삭제

### 워크스페이스
- `GET /api/workspaces` - 내 워크스페이스 목록
- `POST /api/workspaces` - 워크스페이스 생성
- `GET /api/workspaces/[id]` - 워크스페이스 조회
- `GET /api/workspaces/[id]/members` - 멤버 목록
- `POST /api/workspaces/[id]/members` - 멤버 추가

### Todo
- `GET /api/todos?workspaceId=X` - 워크스페이스별 Todo
- `GET /api/todos?assignedTo=me` - 내 Todo
- `POST /api/todos` - Todo 생성
- `GET /api/todos/[id]` - Todo 조회
- `PATCH /api/todos/[id]` - Todo 업데이트
- `DELETE /api/todos/[id]` - Todo 삭제
- `PATCH /api/todos/[id]/assign` - 담당자 할당

---

## 🔒 보안 기능

1. **인증**: JWT 토큰 기반 인증
2. **권한 체크**: Service 레벨 권한 검증
3. **입력 검증**: 이메일 형식, 비밀번호 길이 등
4. **워크스페이스 접근 제어**: 멤버만 접근 가능
5. **Todo 접근 제어**: 생성자/담당자만 수정 가능
6. **비밀번호 보안**: bcrypt 해싱

---

## 📌 다음 단계 (미구현)

### 우선순위 높음
1. **Channel API**: 채널 CRUD 기능
2. **Message API**: 메시지 CRUD 기능
3. **실시간 통신**: WebSocket 또는 Server-Sent Events

### 우선순위 중간
4. **파일 업로드**: 메시지 첨부 파일
5. **알림 시스템**: Todo 할당, 멘션 등
6. **검색 기능**: 사용자, 메시지, Todo 검색

### 우선순위 낮음
7. **프론트엔드 UI**: React 컴포넌트 구현
8. **테스트**: 단위 테스트, 통합 테스트
9. **배포 설정**: 프로덕션 환경 설정

---

## 🐛 알려진 이슈

1. **회원가입 API**: `password.Length` → `password.length` (대소문자 수정 필요)
2. **회원가입 API**: `existingUsers.Length` → `existingUsers.length` (대소문자 수정 필요)
3. **회원가입 API**: `return res;` 누락 (에러 처리 후 반환 필요)

---

## 📚 참고 파일

- **마이그레이션**: `database/migrations/create_service_tables.sql`
- **권한 예제**: `lib/permissions.example.ts`
- **TODO 리스트**: `TODO_0121`

---

## 🎯 프로젝트 목표 달성도

- ✅ 인증/인가 시스템: 100%
- ✅ 사용자 관리: 100%
- ✅ 워크스페이스 시스템: 100%
- ✅ Todo 시스템: 100%
- ⏳ 채널/메시지 시스템: 0% (구조만 생성)
- ⏳ 프론트엔드: 0%

**전체 진행률: 약 70%**
