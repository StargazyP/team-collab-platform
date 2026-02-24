import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getChannelById } from '@/services/channel.service';
import { canAccessChannel } from '@/lib/permissions';
import { isWorkspaceMember } from '@/lib/permissions';
import { AccessToken } from 'livekit-server-sdk';

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = process.env.LIVEKIT_URL;
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!url || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'LiveKit not configured' },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { roomName, channelId: channelIdParam, workspaceId: workspaceIdParam } = body;

    let room = roomName as string;
    if (!room && channelIdParam) {
      const channelId = Number(channelIdParam);
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
      room = `huddle-channel-${channelId}`;
    } else if (!room && workspaceIdParam) {
      const workspaceId = Number(workspaceIdParam);
      if (Number.isNaN(workspaceId)) {
        return NextResponse.json({ error: 'Invalid workspace id' }, { status: 400 });
      }
      const isMember = await isWorkspaceMember(user.id, workspaceId);
      if (!isMember) {
        return NextResponse.json(
          { error: 'Forbidden: Not a workspace member' },
          { status: 403 }
        );
      }
      room = `huddle-workspace-${workspaceId}`;
    }

    if (!room || typeof room !== 'string') {
      return NextResponse.json(
        { error: 'roomName, channelId, or workspaceId required' },
        { status: 400 }
      );
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity: String(user.id),
      name: user.name || `User ${user.id}`,
    });

    at.addGrant({
      roomJoin: true,
      room,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    return NextResponse.json({
      token,
      url,
      room,
    });
  } catch (error) {
    console.error('LiveKit token error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
