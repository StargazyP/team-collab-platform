import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getWorkspaceChannels, createChannel } from '@/services/channel.service';
import { isWorkspaceMember } from '@/lib/permissions';

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
    const workspaceId = Number(id);
    if (Number.isNaN(workspaceId)) {
      return NextResponse.json({ error: 'Invalid workspace id' }, { status: 400 });
    }

    const member = await isWorkspaceMember(user.id, workspaceId);
    if (!member) {
      return NextResponse.json(
        { error: 'Forbidden: Not a member of this workspace' },
        { status: 403 }
      );
    }

    const channels = await getWorkspaceChannels(workspaceId);
    return NextResponse.json({ channels });
  } catch (error) {
    console.error('Get channels error:', error);
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
    const workspaceId = Number(id);
    if (Number.isNaN(workspaceId)) {
      return NextResponse.json({ error: 'Invalid workspace id' }, { status: 400 });
    }

    const member = await isWorkspaceMember(user.id, workspaceId);
    if (!member) {
      return NextResponse.json(
        { error: 'Forbidden: Not a member of this workspace' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, description } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Channel name is required' },
        { status: 400 }
      );
    }

    const channelId = await createChannel({
      name: name.trim(),
      description: description?.trim() || undefined,
      workspaceId,
      createdBy: user.id,
    });

    return NextResponse.json({ success: true, channelId });
  } catch (error) {
    console.error('Create channel error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
