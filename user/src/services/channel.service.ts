import { getDB } from "@/lib/db";

export interface ChannelRow {
  id: number;
  name: string;
  description: string | null;
  workspaceId: number;
  createdBy: number;
  isPrivate: boolean;
  isDM?: number | null;
  dmUser1Id?: number | null;
  dmUser2Id?: number | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export async function getWorkspaceChannels(workspaceId: number): Promise<ChannelRow[]> {
  const db = getDB();
  const [rows] = await db.query(
    `SELECT id, name, description, workspaceId, createdBy, isPrivate, createdAt, updatedAt
     FROM channels
     WHERE workspaceId = ? AND (isDM = 0 OR isDM IS NULL)
     ORDER BY createdAt ASC`,
    [workspaceId]
  );
  return (rows as ChannelRow[]) || [];
}

export async function getChannelById(id: number): Promise<ChannelRow | null> {
  const db = getDB();
  const [rows] = await db.query(
    "SELECT * FROM channels WHERE id = ?",
    [id]
  );
  const arr = rows as ChannelRow[];
  return arr?.[0] ?? null;
}

export async function createChannel(data: {
  name: string;
  description?: string;
  workspaceId: number;
  createdBy: number;
  isPrivate?: boolean;
}): Promise<number> {
  const db = getDB();
  const [result] = await db.query(
    "INSERT INTO channels (name, description, workspaceId, createdBy, isPrivate) VALUES (?, ?, ?, ?, ?)",
    [
      data.name,
      data.description || null,
      data.workspaceId,
      data.createdBy,
      data.isPrivate ?? false,
    ]
  );
  const insertId = (result as { insertId: number }).insertId;
  await db.query(
    "INSERT INTO channel_members (channelId, userId) VALUES (?, ?)",
    [insertId, data.createdBy]
  );
  return insertId;
}

export async function deleteChannel(channelId: number): Promise<boolean> {
  const db = getDB();
  const [result] = await db.query('DELETE FROM channels WHERE id = ?', [channelId]);
  const affected = (result as { affectedRows: number }).affectedRows;
  return affected > 0;
}
