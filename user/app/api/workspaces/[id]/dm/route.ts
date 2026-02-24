import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { isWorkspaceMember } from '@/lib/permissions';
import { getOrCreateDmChannel } from '@/services/dm.service';

type Params = { id: string };

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
    const targetUserId = Number(body.targetUserId);
    if (!targetUserId || Number.isNaN(targetUserId)) {
      return NextResponse.json(
        { error: 'targetUserId is required' },
        { status: 400 }
      );
    }

    const targetMember = await isWorkspaceMember(targetUserId, workspaceId);
    if (!targetMember) {
      return NextResponse.json(
        { error: 'Target user is not a workspace member' },
        { status: 400 }
      );
    }

    const channelId = await getOrCreateDmChannel(
      workspaceId,
      user.id,
      targetUserId
    );

    return NextResponse.json({ channelId });
  } catch (error) {
    console.error('Create DM error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
