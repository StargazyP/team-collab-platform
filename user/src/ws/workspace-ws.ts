import "dotenv/config";
import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import { createMessage } from "../services/message.service";
import { getChannelById } from "../services/channel.service";
import { canAccessChannel } from "../lib/permissions";
import { getDB } from "../lib/db";
import {
  createNotification,
  getMessageNotificationRecipients,
} from "../services/notification.service";
import { extractMentionedUserIds } from "../lib/sanitize";

const PORT = Number(process.env.WS_PORT) || 8081;
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface AuthPayload {
  sub: number;
  role: string;
}

interface ClientState {
  userId: number;
  channels: Set<number>;
}

const clients = new Map<import("ws").WebSocket, ClientState>();

function getUserIdFromToken(token: string): number | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    const id = Number(decoded.sub);
    return Number.isNaN(id) ? null : id;
  } catch {
    return null;
  }
}

function broadcastToChannel(channelId: number, message: object) {
  const payload = JSON.stringify(message);
  for (const [ws, state] of clients) {
    if (state.channels.has(channelId) && ws.readyState === 1) {
      ws.send(payload);
    }
  }
}

function sendToUser(userId: number, message: object) {
  const payload = JSON.stringify(message);
  const targetId = Number(userId);
  let sent = 0;
  for (const [ws, state] of clients) {
    if (Number(state.userId) === targetId && ws.readyState === 1) {
      ws.send(payload);
      sent++;
    }
  }
  if (sent === 0) {
    console.log("[WS] No connection for user", targetId, "| clients:", Array.from(clients.entries()).map(([, s]) => s.userId));
  }
}

const wss = new WebSocketServer({ port: PORT });

wss.on("connection", (ws, req) => {
  const url = new URL(req.url || "", `http://${req.headers.host}`);
  const token = url.searchParams.get("token");

  const userId = token ? getUserIdFromToken(token) : null;
  if (!userId) {
    ws.close(4001, "Unauthorized");
    return;
  }

  clients.set(ws, { userId, channels: new Set() });

  ws.on("message", async (data) => {
    try {
      const msg = JSON.parse(data.toString());
      const state = clients.get(ws);
      if (!state) return;

      if (msg.type === "join") {
        const channelId = Number(msg.channelId);
        if (!channelId) return;
        const channel = await getChannelById(channelId);
        if (!channel) return;
        const canAccess = await canAccessChannel(
          state.userId,
          channelId,
          channel.workspaceId,
          channel.isPrivate
        );
        if (canAccess) {
          state.channels.add(channelId);
          ws.send(JSON.stringify({ type: "joined", channelId }));
        }
      } else if (msg.type === "leave") {
        const channelId = Number(msg.channelId);
        if (channelId) state.channels.delete(channelId);
      } else if (msg.type === "message") {
        const channelId = Number(msg.channelId);
        const content = msg.content;
        if (!channelId || !content || typeof content !== "string") return;
        if (!state.channels.has(channelId)) return;

        const channel = await getChannelById(channelId);
        if (!channel) return;
        const canAccess = await canAccessChannel(
          state.userId,
          channelId,
          channel.workspaceId,
          channel.isPrivate
        );
        if (!canAccess) return;

        const messageId = await createMessage({
          content: content.trim(),
          channelId,
          userId: state.userId,
        });

        const db = getDB();
        const [rows] = await db.query(
          `SELECT m.id, m.content, m.channelId, m.userId, m.createdAt, u.name as userName
           FROM messages m
           LEFT JOIN users u ON m.userId = u.id
           WHERE m.id = ?`,
          [messageId]
        );
        const saved = (rows as any[])?.[0];

        broadcastToChannel(channelId, {
          type: "message",
          message: saved
            ? {
                id: saved.id,
                content: saved.content,
                channelId: saved.channelId,
                userId: saved.userId,
                userName: saved.userName,
                createdAt: saved.createdAt,
              }
            : { id: messageId, content: content.trim(), channelId, userId: state.userId, createdAt: new Date().toISOString() },
        });

        const mentionedIds = new Set(extractMentionedUserIds(content.trim()));
        const senderId = Number(state.userId);
        const senderName = (saved?.userName as string) || "Unknown";
        const contentPreview = (content || "").replace(/<[^>]+>/g, "").slice(0, 100);
        const messageCreatedAt = saved?.createdAt ?? new Date().toISOString();

        for (const targetUserId of mentionedIds) {
          if (targetUserId === senderId) continue;
          try {
            const notifId = await createNotification({
              userId: targetUserId,
              messageId: saved?.id ?? messageId,
              channelId,
              channelName: channel.name,
              senderId,
              senderName,
              contentPreview,
              type: "mention",
            });
            sendToUser(targetUserId, {
              type: "notification",
              notification: {
                id: notifId,
                messageId: saved?.id ?? messageId,
                channelId,
                channelName: channel.name,
                senderId,
                senderName,
                contentPreview,
                createdAt: messageCreatedAt,
              },
            });
          } catch (err) {
            console.error("Create notification error:", err);
          }
        }

        const recipients = await getMessageNotificationRecipients(channel, senderId);
        for (const targetUserId of recipients) {
          if (mentionedIds.has(targetUserId)) continue;
          try {
            const notifId = await createNotification({
              userId: targetUserId,
              messageId: saved?.id ?? messageId,
              channelId,
              channelName: channel.name,
              senderId,
              senderName,
              contentPreview,
              type: "message",
            });
            sendToUser(targetUserId, {
              type: "notification",
              notification: {
                id: notifId,
                messageId: saved?.id ?? messageId,
                channelId,
                channelName: channel.name,
                senderId,
                senderName,
                contentPreview,
                createdAt: messageCreatedAt,
              },
            });
          } catch (err) {
            console.error("Create notification error:", err);
          }
        }
      }
    } catch (err) {
      console.error("WS message error:", err);
    }
  });

  ws.on("close", () => {
    clients.delete(ws);
  });
});

console.log(`WebSocket server running on port ${PORT}`);
