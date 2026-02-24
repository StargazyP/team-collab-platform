import { getDB } from '@/lib/db';
import { getWorkspaceMemberUserIds } from '@/services/workspace.service';
import type { ChannelRow } from '@/services/channel.service';

export type NotificationType = 'mention' | 'message';

export interface CreateNotificationParams {
  userId: number;
  messageId: number;
  channelId: number;
  channelName: string;
  senderId: number;
  senderName: string;
  contentPreview: string;
  type?: NotificationType;
}

export async function createNotification(params: CreateNotificationParams): Promise<number> {
  const db = getDB();
  const type = params.type ?? 'mention';
  const [result] = await db.query(
    `INSERT INTO notifications (userId, type, messageId, channelId, channelName, senderId, senderName, contentPreview, isRead)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      params.userId,
      type,
      params.messageId,
      params.channelId,
      params.channelName,
      params.senderId,
      params.senderName,
      (params.contentPreview || '').slice(0, 200),
    ]
  );
  return (result as any).insertId;
}

/** 메시지 수신 알림을 보낼 대상 userId 목록 (발신자 제외, 멘션 대상은 호출 측에서 제외) */
export async function getMessageNotificationRecipients(
  channel: ChannelRow,
  senderId: number
): Promise<number[]> {
  if (channel.isDM && channel.dmUser1Id != null && channel.dmUser2Id != null) {
    return [channel.dmUser1Id, channel.dmUser2Id].filter((id) => id !== senderId);
  }
  const memberIds = await getWorkspaceMemberUserIds(channel.workspaceId);
  return memberIds.filter((id) => id !== senderId);
}

export async function getUnreadNotifications(userId: number, limit = 20) {
  const db = getDB();
  const [rows] = await db.query(
    `SELECT id, userId, type, messageId, channelId, channelName, senderId, senderName, contentPreview, isRead, createdAt
     FROM notifications
     WHERE userId = ? AND isRead = 0
     ORDER BY createdAt DESC
     LIMIT ?`,
    [userId, limit]
  );
  return rows as any[];
}

export async function markAsRead(notificationId: number, userId: number): Promise<boolean> {
  const db = getDB();
  const [result] = await db.query(
    'UPDATE notifications SET isRead = 1 WHERE id = ? AND userId = ?',
    [notificationId, userId]
  );
  return (result as any).affectedRows > 0;
}
