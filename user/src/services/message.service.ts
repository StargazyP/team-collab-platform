import { getDB } from "@/lib/db";

export interface MessageRow {
  id: number;
  content: string;
  channelId: number;
  userId: number;
  parentMessageId: number | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export async function getChannelMessages(channelId: number, limit = 100): Promise<(MessageRow & { userName?: string })[]> {
  const db = getDB();
  const [rows] = await db.query(
    `SELECT m.id, m.content, m.channelId, m.userId, m.parentMessageId, m.createdAt, m.updatedAt, u.name as userName
     FROM messages m
     LEFT JOIN users u ON m.userId = u.id
     WHERE m.channelId = ? AND m.parentMessageId IS NULL
     ORDER BY m.createdAt ASC
     LIMIT ?`,
    [channelId, limit]
  );
  return (rows as any[]) || [];
}

/** 채널 내 메시지 본문(content) 검색. HTML 태그 제거 후 검색하려면 호출 측에서 처리 가능. */
export async function searchChannelMessages(
  channelId: number,
  query: string,
  limit = 50
): Promise<(MessageRow & { userName?: string })[]> {
  if (!query || !query.trim()) return [];
  const db = getDB();
  const q = `%${query.trim().replace(/%/g, '\\%').replace(/_/g, '\\_')}%`;
  const [rows] = await db.query(
    `SELECT m.id, m.content, m.channelId, m.userId, m.parentMessageId, m.createdAt, m.updatedAt, u.name as userName
     FROM messages m
     LEFT JOIN users u ON m.userId = u.id
     WHERE m.channelId = ? AND m.parentMessageId IS NULL AND m.content LIKE ?
     ORDER BY m.createdAt DESC
     LIMIT ?`,
    [channelId, q, limit]
  );
  return (rows as any[]) || [];
}

export async function createMessage(data: {
  content: string;
  channelId: number;
  userId: number;
  parentMessageId?: number;
}): Promise<number> {
  const db = getDB();
  const [result] = await db.query(
    "INSERT INTO messages (content, channelId, userId, parentMessageId) VALUES (?, ?, ?, ?)",
    [data.content, data.channelId, data.userId, data.parentMessageId || null]
  );
  return (result as { insertId: number }).insertId;
}
