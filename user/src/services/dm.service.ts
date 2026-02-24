import { getDB } from '@/lib/db';

export async function getOrCreateDmChannel(
  workspaceId: number,
  currentUserId: number,
  targetUserId: number
): Promise<number> {
  const db = getDB();
  const u1 = Math.min(currentUserId, targetUserId);
  const u2 = Math.max(currentUserId, targetUserId);

  const [existing] = await db.query(
    `SELECT id FROM channels
     WHERE workspaceId = ? AND isDM = 1 AND dmUser1Id = ? AND dmUser2Id = ?`,
    [workspaceId, u1, u2]
  );

  const rows = existing as { id: number }[];
  if (rows?.[0]) {
    const channelId = rows[0].id;
    const [memberRows] = await db.query(
      'SELECT id FROM channel_members WHERE channelId = ? AND userId = ?',
      [channelId, currentUserId]
    );
    if ((memberRows as any[]).length === 0) {
      await db.query(
        'INSERT INTO channel_members (channelId, userId) VALUES (?, ?)',
        [channelId, currentUserId]
      );
    }
    return channelId;
  }

  const channelName = `dm-${u1}-${u2}`;
  const [result] = await db.query(
    `INSERT INTO channels (name, workspaceId, createdBy, isPrivate, isDM, dmUser1Id, dmUser2Id)
     VALUES (?, ?, ?, 1, 1, ?, ?)`,
    [channelName, workspaceId, currentUserId, u1, u2]
  );

  const channelId = (result as { insertId: number }).insertId;
  if (currentUserId === targetUserId) {
    await db.query(
      'INSERT INTO channel_members (channelId, userId) VALUES (?, ?)',
      [channelId, currentUserId]
    );
  } else {
    await db.query(
      'INSERT INTO channel_members (channelId, userId) VALUES (?, ?), (?, ?)',
      [channelId, currentUserId, channelId, targetUserId]
    );
  }

  return channelId;
}
