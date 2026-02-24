import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getWorkspaceById } from '@/services/workspace.service';
import { getDB } from '@/lib/db';

type Params = { id: string; userId: string };

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: workspaceIdParam, userId: targetUserIdParam } = await params;
    const workspaceId = Number(workspaceIdParam);
    const targetUserId = Number(targetUserIdParam);

    if (Number.isNaN(workspaceId) || Number.isNaN(targetUserId)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const workspace = await getWorkspaceById(workspaceId);
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    if (workspace.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: Only workspace owner can remove members' },
        { status: 403 }
      );
    }

    if (targetUserId === user.id) {
      return NextResponse.json(
        { error: 'Cannot remove yourself' },
        { status: 400 }
      );
    }

    const db = getDB();
    const [rows] = await db.query(
      'SELECT role FROM workspace_members WHERE workspaceId = ? AND userId = ?',
      [workspaceId, targetUserId]
    );
    const member = (rows as { role: string }[])?.[0];
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }
    if (member.role === 'owner') {
      return NextResponse.json(
        { error: 'Cannot remove workspace owner' },
        { status: 400 }
      );
    }

    await db.query(
      'DELETE FROM workspace_members WHERE workspaceId = ? AND userId = ?',
      [workspaceId, targetUserId]
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Remove member error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
