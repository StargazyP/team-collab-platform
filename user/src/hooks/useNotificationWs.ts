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
  messageId: number;
  channelId: number;
  channelName: string;
  senderId: number;
  senderName: string;
  contentPreview: string;
  createdAt: string;
}

export function useNotificationWs(workspaceId: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const tokenRef = useRef<string | null>(null);

  const addNotification = useCallback((n: Notification) => {
    setNotifications((prev) => [n, ...prev].slice(0, 50));
    setUnreadCount((c) => c + 1);
  }, []);

  const mergeNotifications = useCallback((list: Notification[]) => {
    if (list.length === 0) return;
    setNotifications((prev) => {
      const byId = new Map(prev.map((n) => [n.id, n]));
      for (const n of list) {
        const item = { ...n, id: Number(n.id), messageId: Number(n.messageId), channelId: Number(n.channelId), senderId: Number(n.senderId) };
        if (!byId.has(item.id)) byId.set(item.id, item);
      }
      return Array.from(byId.values())
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 50);
    });
    setUnreadCount((c) => Math.max(c, list.length));
  }, []);

  useEffect(() => {
    if (!workspaceId) return;

    let mounted = true;

    const connect = async () => {
      try {
        const res = await fetch('/api/auth/ws-token', { credentials: 'include' });
        if (!res.ok || !mounted) return;
        const data = await res.json();
        const token = data.token;
        if (!token || !mounted) return;

        tokenRef.current = token;
        const url = `${WS_URL}?token=${encodeURIComponent(token)}`;
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          if (mounted) setConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'notification' && data.notification && mounted) {
              addNotification(data.notification);
            }
          } catch {
            // ignore
          }
        };

        ws.onclose = () => {
          if (mounted) {
            setConnected(false);
            wsRef.current = null;
          }
        };

        ws.onerror = () => {
          if (mounted) setConnected(false);
        };
      } catch {
        // ignore
      }
    };

    connect();

    return () => {
      mounted = false;
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      wsRef.current = null;
    };
  }, [workspaceId, addNotification]);

  const clearUnread = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const removeNotification = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return { notifications, unreadCount, connected, clearUnread, removeNotification, mergeNotifications };
}
