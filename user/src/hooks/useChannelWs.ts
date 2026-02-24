'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

const getWsUrl = () => {
  if (process.env.NEXT_PUBLIC_WS_URL) return process.env.NEXT_PUBLIC_WS_URL;
  const host = process.env.NEXT_PUBLIC_WS_HOST || 'localhost';
  const port = process.env.NEXT_PUBLIC_WS_PORT || '8081';
  return `ws://${host}:${port}`;
};
const WS_URL = getWsUrl();

interface Message {
  id: number;
  content: string;
  channelId: number;
  userId: number;
  userName?: string;
  createdAt: string;
}

export function useChannelWs(channelId: number | null, token: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const sendMessage = useCallback(
    (content: string) => {
      if (!wsRef.current || wsRef.current.readyState !== 1 || !channelId) return;
      wsRef.current.send(
        JSON.stringify({ type: 'message', channelId, content })
      );
    },
    [channelId]
  );

  useEffect(() => {
    if (!channelId || !token) return;

    const url = `${WS_URL}?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      ws.send(JSON.stringify({ type: 'join', channelId }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'message' && data.message) {
          setMessages((prev) => [...prev, data.message]);
        }
      } catch {
        // ignore
      }
    };

    ws.onclose = () => {
      setConnected(false);
      wsRef.current = null;
    };

    ws.onerror = () => {
      setConnected(false);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'leave', channelId }));
      }
      ws.close();
      wsRef.current = null;
    };
  }, [channelId, token]);

  return { messages, setMessages, connected, sendMessage };
}
