# src 디렉토리 코드 리뷰 (흐름 순서)

앱 실행 흐름에 맞춰 **기반 레이어 → 도메인 → 서비스 → 실시간(WS) → 훅 → 컨텍스트 → 컴포넌트** 순으로 정리한 코드 리뷰입니다.

---

## 1. 기반 레이어 (lib)

### 1.1 `lib/db.ts`

- **역할**: MySQL 연결 풀 싱글톤. 모든 서비스/API에서 DB 접근 시 사용.
- **흐름**: `getDB()` 최초 호출 시 `mysql.createPool()`로 풀 생성, 이후 동일 인스턴스 반환.
- **장점**: `connectionLimit: 10`, `waitForConnections` 등 기본 설정 적절.
- **개선**: `DB_HOST` 등 env 미설정 시 `process.env.DB_HOST!`로 인한 런타임 오류 가능. 앱 부트 시 env 검증 또는 풀 생성 실패 시 명시적 throw 권장.

---

### 1.2 `lib/auth.ts`

- **역할**: JWT 검증, 서버/API용 사용자 추출.
- **흐름**:
  - `verifyToken(token)` → JWT 검증 후 `JWTPayload` 반환.
  - `getServerUser()` → 쿠키의 `token`으로 Server Component에서 사용자 조회.
  - `getUserFromRequest(req)` → API: 먼저 `getCurrentUser(req)`(x-user-id, x-user-role), 없으면 쿠키에서 토큰 검증.
- **장점**: Server / API 경로 분리, 쿠키·헤더 fallback 명확.
- **개선**:
  - `getCurrentUser` 내부 `console.log`는 운영 시 제거 또는 로그 레벨 분리.
  - API에서 `user.name` 사용하는 곳이 있는데, 현재 반환 타입은 `{ id, role }`만 있음. 알림 등에서 이름이 필요하면 `getUserFromRequest`에서 DB 조회해 `name` 포함하거나, 호출부에서 별도 조회 필요.

---

### 1.3 `lib/cookie.ts`

- **역할**: 인증 쿠키 옵션 (HttpOnly, sameSite, secure, maxAge).
- **흐름**: 로그인 API 등에서 `getAuthCookieOptions()`로 쿠키 설정 시 사용.
- **장점**: 프로덕션에서 `sameSite: "none"`, `secure: true` 적용으로 크로스 도메인·HTTPS 대응.

---

### 1.4 `lib/permissions.ts`

- **역할**: 워크스페이스 멤버, 역할, 채널 접근, TODO 담당자/생성자 등 권한 판단.
- **흐름**: API 라우트에서 `isWorkspaceMember`, `canAccessChannel`, `isTodoCreator` 등 호출 후 403 처리.
- **장점**: `checkPermission`(USER_READ 등), `hasWorkspaceRole`, `isTodoAssignee` 등으로 세분화된 권한 체크 가능.
- **참고**: `const db = getDB()`를 모듈 최상단에서 호출. Next.js에서 풀은 앱 생명주기와 함께 유지되므로 일반적으로 문제 없음.

---

### 1.5 `lib/sanitize.ts`

- **역할**: 메시지/TODO HTML 허용 태그만 통과, 멘션(`data-mention`) 보존. XSS 방지.
- **흐름**: `sanitizeHtml(html)` → DOMParser로 파싱 후 허용 태그만 재구성. `extractMentionedUserIds(html)` → 멘션 대상 userId 추출.
- **장점**: 화이트리스트 방식, `b/strong`, `ul/ol/li`, `blockquote`, `span[data-mention]` 등 리치 텍스트에 맞게 정의됨.

---

## 2. 도메인 (domain)

### 2.1 `domain/workspace.ts`, `domain/todo.ts`, `domain/index.ts`

- **역할**: 워크스페이스·TODO 등 도메인 타입 정의. `domain/index.ts`에서 일괄 re-export.
- **흐름**: 서비스 레이어는 자체 `*Row` 타입을 주로 사용하고, 도메인 타입은 API 응답·프론트 타입 정합성용으로 활용 가능.
- **개선**: 서비스와 도메인 타입 매핑을 한곳에서 하면(예: `toWorkspace(row)`) DTO와 도메인 분리가 더 명확해짐.

---

## 3. 서비스 레이어 (services)

### 3.1 `services/workspace.service.ts`

- **역할**: 워크스페이스 CRUD, 멤버 userId 목록 조회.
- **흐름**: `getUserWorkspaces(userId)` → 가입 워크스페이스 목록. `getWorkspaceById`, `createWorkspace`. `getWorkspaceMemberUserIds(workspaceId)` → 알림 수신 대상 등.
- **장점**: `getWorkspaceMemberUserIds`로 알림 대상 조회가 서비스에 잘 분리됨.

---

### 3.2 `services/channel.service.ts`

- **역할**: 채널 CRUD, DM 여부·참여자 식별용 필드 포함.
- **흐름**: `getWorkspaceChannels` → DM 제외 채널 목록. `getChannelById` → `SELECT *`로 `isDM`, `dmUser1Id`, `dmUser2Id` 포함. `createChannel` 시 `channel_members`에 생성자 추가.
- **장점**: `ChannelRow`에 DM용 필드 추가로 알림 수신자 계산이 단순해짐.
- **참고**: `getWorkspaceChannels`는 `isDM` 등 미조회. DM 목록은 별도 API/서비스에서 처리하는 구조로 보임.

---

### 3.3 `services/dm.service.ts`

- **역할**: DM 채널 생성/조회. 동일 두 사용자 간 채널은 하나만 유지.
- **흐름**: `getOrCreateDmChannel(workspaceId, currentUserId, targetUserId)` → `dmUser1Id/dmUser2Id` 정렬 후 기존 채널 조회, 없으면 INSERT 후 `channel_members`에 두 명 등록.
- **장점**: u1/u2 정렬로 중복 채널 방지.

---

### 3.4 `services/message.service.ts`

- **역할**: 메시지 목록·검색·생성.
- **흐름**: `getChannelMessages(channelId)` → 루트 메시지만, 작성자명 JOIN. `searchChannelMessages(channelId, query)` → `LIKE %q%`, `%`/`_` 이스케이프. `createMessage` → INSERT 후 insertId 반환.
- **장점**: 검색 시 와일드카드 이스케이프로 인젝션·의도치 않은 매칭 방지.

---

### 3.5 `services/notification.service.ts`

- **역할**: 알림 생성(mention / message), 수신 대상 계산, 미확인 조회·읽음 처리.
- **흐름**: `createNotification(params)` → `type` 기본값 `'mention'`. `getMessageNotificationRecipients(channel, senderId)` → DM이면 상대 1명, 일반 채널이면 워크스페이스 멤버(발신자 제외). `getUnreadNotifications`, `markAsRead`.
- **장점**: mention / message 타입 분리, 수신자 로직이 한곳에 모여 있음.
- **의존**: `getWorkspaceMemberUserIds(workspace.service)`, `ChannelRow(channel.service)` 사용.

---

### 3.6 `services/todo.service.ts`

- **역할**: TODO CRUD, 워크스페이스별 목록(작성자명 포함).
- **흐름**: `getWorkspaceTodos`, `getTodo`, `createTodo`, `updateTodo`(부분 필드), `deleteTodo`.
- **장점**: `updateTodo`에서 변경 필드만 동적 쿼리 구성.

---

## 4. WebSocket 서버 (ws)

### 4.1 `ws/workspace-ws.ts`

- **역할**: 채널 메시지 실시간 전송·수신, 멘션/메시지 수신 알림 푸시.
- **흐름**:
  1. 연결 시 URL `token`으로 JWT 검증 → `userId` 추출, `clients.set(ws, { userId, channels })`.
  2. `join` → 채널 접근 권한 확인 후 `state.channels.add(channelId)`.
  3. `message` → 해당 채널에 join된 상태에서만 메시지 허용. `createMessage` 후 채널 브로드캐스트. 멘션 대상에 `createNotification(type: 'mention')` + `sendToUser`. 그 다음 `getMessageNotificationRecipients`로 수신자에게 `createNotification(type: 'message')` + `sendToUser`.
- **장점**: API와 동일한 권한·알림 로직 유지. `sendToUser`로 알림만 대상 사용자에게 전달.
- **개선**: 에러 시 클라이언트에 에러 메시지 타입으로 응답하면 디버깅에 유리함. `message` 핸들러 내부에서 예외 시에도 브로드캐스트는 이미 나간 상태이므로, 알림 실패는 로그만 하고 메시지 전달은 유지하는 현재 방식은 합리적.

---

## 5. 훅 (hooks)

### 5.1 `hooks/useChannelWs.ts`

- **역할**: 채널별 WebSocket 연결, 메시지 목록 상태·전송.
- **흐름**: `channelId`, `token`이 있으면 `WS_URL?token=...` 연결 → `onopen`에서 `join` 전송. `onmessage`에서 `type === 'message'`면 `setMessages(prev => [...prev, data.message])`. `sendMessage(content)`는 `type: 'message'`로 전송. cleanup 시 `leave` 후 close.
- **장점**: 채널/토큰 변경 시 effect 재실행으로 연결 갱신. `setMessages`를 외부에서 초기 목록으로 세팅 가능.

---

### 5.2 `hooks/useNotificationWs.ts`

- **역할**: 알림 WebSocket 연결, 실시간 알림 추가·목록 병합·미확인 개수.
- **흐름**: `workspaceId` 기준으로 마운트 시 `/api/auth/ws-token`으로 토큰 획득 후 연결. `type === 'notification'` 수신 시 `addNotification`. `mergeNotifications`로 기존 목록과 id 기준 병합·정렬·상한 50건. `clearUnread`, `removeNotification` 노출.
- **장점**: 알림은 사용자 단위로 오므로 workspaceId는 연결 트리거로만 사용해도 됨. `mergeNotifications`로 API 조회 결과와 실시간 푸시를 일관되게 유지.

---

## 6. 컨텍스트 (contexts)

### 6.1 `contexts/HuddleLayoutContext.tsx`

- **역할**: 허들(음성/영상) 입장 여부·워크스페이스 정보를 전역에 공유.
- **흐름**: `HuddleLayoutProvider`가 `inHuddle`, `workspaceId`, `workspaceName` 상태 보관. `enterHuddle(workspaceId, workspaceName)`, `leaveHuddle()` 제공. `useHuddleLayout()`은 미제공 시 no-op 구현 반환.
- **장점**: Provider 미사용 시에도 훅이 깨지지 않음.

---

## 7. 컴포넌트 (components)

### 7.1 `WorkspaceHeader.tsx`, `WorkspaceSidebar.tsx`

- **역할**: 워크스페이스 레이아웃 상단(뒤로가기, 알림, 마이페이지), 좌측 사이드바(채널/DM/TODO/멤버 링크, 허들 입장).
- **흐름**: Header는 `NotificationBell(workspaceId)` 사용. Sidebar는 경로·params로 활성 구분, 채널/멤버 API로 목록 조회 후 링크 렌더링.
- **참고**: Sidebar에 채널 삭제(방장), 멤버 내보내기 등 권한별 UI가 있음.

---

### 7.2 `MessageInput.tsx`, `RichTextEditor.tsx`

- **역할**: 채널/DM용 리치 텍스트 입력(툴바 + contentEditable), TODO 상세용 에디터.
- **흐름**: `document.execCommand`로 굵게/목록/인용 등 적용. 제출 시 `sanitizeHtml` 후 전달. MessageInput은 멘션 UI·members prop으로 @멘션 지원.
- **장점**: 채널과 TODO에서 툴바 스타일을 맞춰 일관된 UX.

---

### 7.3 `NotificationBell.tsx`

- **역할**: 알림 아이콘·미확인 개수, 클릭 시 드롭다운 목록·링크.
- **흐름**: `useNotificationWs(workspaceId)`로 실시간 수신. 드롭다운 열릴 때 `/api/notifications`로 목록 병합. 클릭 시 `clearUnread`. 알림 클릭 시 채널/메시지로 이동.
- **장점**: WS와 REST 병합으로 새 알림이 즉시 반영됨.

---

### 7.4 `HuddleLayoutWrapper.tsx`, `HuddleRoom.tsx`, `HuddleControlBar.tsx`

- **역할**: 허들 전체/PiP 표시, LiveKit 룸, 마이크/카메라 토글·디바이스 선택·통화 끄기, 말하기 시 초록 띠.
- **흐름**:
  - Wrapper: `useHuddleLayout()`로 현재 워크스페이스와 경로에 따라 전체 화면 vs PiP 결정. PiP일 때 말하기 중이면 `ring-green-500` 등 적용. `HuddleRoom`에 `onSpeakingChange={setIsSpeaking}` 전달.
  - Room: LiveKit 토큰 조회 후 `LiveKitRoom` 렌더. `VoiceActivityReporter`가 `useTrackVolume`으로 볼륨 감지해 `onSpeakingChange` 호출. PiP일 때는 컨트롤 바·ConnectionStateToast 숨김.
  - ControlBar: `TrackToggle`, 디바이스 선택, `useDisconnectButton`으로 통화 종료.
- **장점**: PiP·말하기 인디케이터·권한에 따른 UI 분리가 명확함.

---

## 8. 흐름 요약

1. **인증**: `lib/auth` + `lib/cookie` → API/Server에서 `getUserFromRequest` / `getServerUser`.
2. **권한**: `lib/permissions` → API에서 워크스페이스·채널·TODO 접근 여부 판단.
3. **데이터**: `lib/db` → `services/*` → 채널/메시지/알림/TODO CRUD 및 수신자 계산.
4. **실시간**: `ws/workspace-ws.ts` → 메시지 브로드캐스트·알림 `sendToUser`. 클라이언트는 `useChannelWs`, `useNotificationWs`로 구독.
5. **UI**: `contexts/HuddleLayoutContext` + `components/*` → 워크스페이스/채널/DM/TODO/허들/알림 화면 구성.

이 순서대로 의존성이 이어지므로, 신규 기능 추가 시 위 계층을 따라가면 일관된 구조를 유지하기 쉽습니다.
