# src 디렉토리 구조

- **components/** – React UI 컴포넌트 (허들, 사이드바, 메시지 입력 등)
- **contexts/** – React Context (허들 레이아웃 등)
- **domain/** – 도메인 타입/엔티티 정의 (`Todo`, `Workspace` 등). `domain/index.ts`에서 일괄 export
- **hooks/** – 커스텀 훅 (채널 WS, 알림 WS 등)
- **lib/** – 공용 유틸 (auth, db, cookie, sanitize, permissions). `permissions.example.ts`는 참고용 예제
- **services/** – DB/비즈니스 로직 (workspace, channel, todo, message, notification, dm)
- **ws/** – 워크스페이스 WebSocket 클라이언트

페이지/라우트는 프로젝트 루트의 `app/` 디렉터리를 사용합니다.

- **흐름 순서 코드 리뷰**: `docs/CODE_REVIEW.md` 참고.
