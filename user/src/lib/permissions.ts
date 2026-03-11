import { getDB } from "./db";
import { RowDataPacket } from "mysql2";

/**
 * 사용자가 워크스페이스의 멤버인지 확인
 */
export async function isWorkspaceMember(
  userId: number,
  workspaceId: number
): Promise<RowDataPacket | null> {
  const db = getDB();
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT * FROM workspace_members WHERE userId = ? AND workspaceId = ?",
    [userId, workspaceId]
  );
  return rows[0] || null;
}

/**
 * 사용자가 채널에 접근 가능한지 확인
 * - 공개 채널: 워크스페이스 멤버면 OK
 * - 비공개 채널: channel_members에 있어야 함
 */
export async function canAccessChannel(
  userId: number,
  channelId: number
): Promise<boolean> {
  const db = getDB();

  const [channels] = await db.query<RowDataPacket[]>(
    "SELECT id, workspaceId, isPrivate FROM channels WHERE id = ?",
    [channelId]
  );
  const channel = channels[0];
  if (!channel) return false;

  const member = await isWorkspaceMember(userId, channel.workspaceId);
  if (!member) return false;

  if (!channel.isPrivate) return true;

  const [channelMembers] = await db.query<RowDataPacket[]>(
    "SELECT id FROM channel_members WHERE channelId = ? AND userId = ?",
    [channelId, userId]
  );
  return channelMembers.length > 0;
}

/**
 * TODO의 생성자인지 확인
 */
export async function isTodoCreator(
  userId: number,
  todoId: number
): Promise<boolean> {
  const db = getDB();
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT id FROM todos WHERE id = ? AND createdBy = ?",
    [todoId, userId]
  );
  return rows.length > 0;
}
