# 데이터베이스 마이그레이션 가이드

## 실행 순서

1. **users 테이블에 password_hash 추가** (이미 실행했다면 스킵)
   ```sql
   source database/migrations/add_password_hash.sql;
   ```

2. **서비스 테이블 생성**
   ```sql
   source database/migrations/create_service_tables.sql;
   ```

3. **단일 세션용 tokenVersion 추가**
   ```sql
   source database/migrations/add_token_version.sql;
   ```

또는 MySQL 클라이언트에서 직접 실행:
```bash
mysql -u [username] -p [database_name] < database/migrations/create_service_tables.sql
```

## 생성되는 테이블

1. **workspaces** - 워크스페이스 정보
2. **workspace_members** - 워크스페이스 멤버 정보
3. **channels** - 채널 정보
4. **todos** - Todo 항목
5. **messages** - 메시지
6. **channel_members** - 채널 멤버

## 외래 키 관계

- `workspaces.ownerId` → `users.id`
- `workspace_members.workspaceId` → `workspaces.id`
- `workspace_members.userId` → `users.id`
- `channels.workspaceId` → `workspaces.id`
- `channels.createdBy` → `users.id`
- `todos.workspaceId` → `workspaces.id`
- `todos.channelId` → `channels.id`
- `todos.createdBy` → `users.id`
- `todos.assignedTo` → `users.id`
- `messages.channelId` → `channels.id`
- `messages.userId` → `users.id`
- `messages.parentMessageId` → `messages.id` (스레드)
- `channel_members.channelId` → `channels.id`
- `channel_members.userId` → `users.id`
