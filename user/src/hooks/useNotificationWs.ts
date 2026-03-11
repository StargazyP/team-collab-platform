'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

const getWsUrl = () => {
  if (process.env.NEXT_PUBLIC_WS_URL) return process.env.NEXT_PUBLIC_WS_URL;
  const host = process.env.NEXT_PUBLIC_WS_HOST || 'localhost';
  const port = process.env.NEXT_PUBLIC_WS_PORT || '8081';
  return `ws://${host}:${port}`;
};
const WS_URL = getWsUrl();

export interface Notification {
  id: number;
  userId: number;
  type: 'mention' | 'message';
  messageId: number;
  channelId: number;
  channelName: string;
  senderId: number;
  senderName: string;
  contentPreview: string;
  isRead: number;
  createdAt: string;
}

const MAX_NOTIFICATIONS = 50;

function mergeNotifications(
  existing: Notification[],
  incoming: Notification[]
): Notification[] {
  const map = new Map<number, Notification>();
  for (const n of existing) map.set(n.id, n);
  for (const n of incoming) map.set(n.id, n);
  return Array.from(map.values())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, MAX_NOTIFICATIONS);
}

export function useNotificationWs(workspaceId: number | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);

  const addNotification = useCallback((notification: Notification) => {
    setNotifications((prev) => mergeNotifications(prev, [notification]));
    setUnreadCount((c) => c + 1);
  }, []);

  const clearUnread = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const removeNotification = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const mergeFromApi = useCallback((apiNotifications: Notification[]) => {
    setNotifications((prev) => mergeNotifications(prev, apiNotifications));
    setUnreadCount(apiNotifications.filter((n) => !n.isRead).length);
  }, []);

  useEffect(() => {
    if (!workspaceId) return;

    let ws: WebSocket | null = null;

    (async () => {
      try {
        const tokenRes = await fetch('/api/auth/ws-token', { credentials: 'include' });
        if (!tokenRes.ok) return;
        const { token } = await tokenRes.json();

        const url = `${WS_URL}?token=${encodeURIComponent(token)}`;
        ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'notification' && data.notification) {
              addNotification(data.notification);
            }
          } catch {
            // ignore
          }
        };

        ws.onclose = () => { wsRef.current = null; };
        ws.onerror = () => { /* handled by onclose */ };
      } catch {
        // ignore
      }
    })();

    return () => {
      ws?.close();
      wsRef.current = null;
    };
  }, [workspaceId, addNotification]);

  return {
    notifications,
    unreadCount,
    addNotification,
    clearUnread,
    removeNotification,
    mergeFromApi,
  };
}
