import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getChannelMessages, searchChannelMessages, createMessage } from '@/services/message.service';
import { getChannelById } from '@/services/channel.service';
import { canAccessChannel } from '@/lib/permissions';
import {
  createNotification,
  getMessageNotificationRecipients,
} from '@/services/notification.service';
import { extractMentionedUserIds } from '@/lib/sanitize';

type Params = { id: string };

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const channelId = Number(id);
    if (Number.isNaN(channelId)) {
      return NextResponse.json({ error: 'Invalid channel id' }, { status: 400 });
    }

    const channel = await getChannelById(channelId);
    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    const canAccess = await canAccessChannel(
      user.id,
      channelId,
      channel.workspaceId,
      channel.isPrivate
    );
    if (!canAccess) {
      return NextResponse.json(
        { error: 'Forbidden: No access to this channel' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim();
    if (q) {
      const messages = await searchChannelMessages(channelId, q, 50);
      return NextResponse.json({ messages, search: true });
    }
    const messages = await getChannelMessages(channelId);
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const channelId = Number(id);
    if (Number.isNaN(channelId)) {
      return NextResponse.json({ error: 'Invalid channel id' }, { status: 400 });
    }

    const channel = await getChannelById(channelId);
    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    const canAccess = await canAccessChannel(
      user.id,
      channelId,
      channel.workspaceId,
      channel.isPrivate
    );
    if (!canAccess) {
      return NextResponse.json(
        { error: 'Forbidden: No access to this channel' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { content } = body;

    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    const messageId = await createMessage({
      content: content.trim(),
      channelId,
      userId: user.id,
    });

    const mentionedIds = new Set(extractMentionedUserIds(content.trim()));
    const contentPreview = (content || '').replace(/<[^>]+>/g, '').slice(0, 100);
    for (const targetUserId of mentionedIds) {
      if (targetUserId === user.id) continue;
      try {
        await createNotification({
          userId: targetUserId,
          messageId,
          channelId,
          channelName: channel.name,
          senderId: user.id,
          senderName: user.name || 'Unknown',
          contentPreview,
          type: 'mention',
        });
      } catch (err) {
        console.error('Create notification error:', err);
      }
    }

    const recipients = await getMessageNotificationRecipients(channel, user.id);
    for (const targetUserId of recipients) {
      if (mentionedIds.has(targetUserId)) continue;
      try {
        await createNotification({
          userId: targetUserId,
          messageId,
          channelId,
          channelName: channel.name,
          senderId: user.id,
          senderName: user.name || 'Unknown',
          contentPreview,
          type: 'message',
        });
      } catch (err) {
        console.error('Create notification error:', err);
      }
    }

    return NextResponse.json({ success: true, messageId });
  } catch (error) {
    console.error('Create message error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
