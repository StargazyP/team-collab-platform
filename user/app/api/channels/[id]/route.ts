import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getChannelById, deleteChannel } from '@/services/channel.service';
import { canAccessChannel } from '@/lib/permissions';
import { getDB } from '@/lib/db';
import { getWorkspaceById } from '@/services/workspace.service';

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

    const ch = channel as { isDM?: number; dmUser1Id?: number; dmUser2Id?: number };
    let displayName = channel.name;
    if (ch.isDM && (ch.dmUser1Id || ch.dmUser2Id)) {
      const otherId = ch.dmUser1Id === user.id ? ch.dmUser2Id : ch.dmUser1Id;
      if (otherId) {
        const db = getDB();
        const [rows] = await db.query(
          'SELECT name FROM users WHERE id = ?',
          [otherId]
        );
        const u = (rows as { name: string }[])?.[0];
        displayName = u?.name || `User #${otherId}`;
      }
    }

    return NextResponse.json({
      channel: {
        id: channel.id,
        name: channel.name,
        displayName,
        isDM: !!ch.isDM,
        description: channel.description,
        workspaceId: channel.workspaceId,
      },
    });
  } catch (error) {
    console.error('Get channel error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const workspace = await getWorkspaceById(channel.workspaceId);
    if (!workspace || workspace.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: Only workspace owner can delete channels' },
        { status: 403 }
      );
    }

    const deleted = await deleteChannel(channelId);
    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete channel' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Delete channel error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
