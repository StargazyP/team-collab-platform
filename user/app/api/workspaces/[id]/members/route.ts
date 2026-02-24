import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { isWorkspaceMember } from '@/lib/permissions';
import { getDB } from '@/lib/db';
import { getWorkspaceById } from '@/services/workspace.service';

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

    const workspace = await getWorkspaceById(workspaceId);
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    if (workspace.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: Only workspace owner can add members' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const targetUserId = Number(body.userId);
    const role = (body.role as string) || 'member';

    if (!targetUserId || Number.isNaN(targetUserId)) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    if (!['member', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be member or admin' },
        { status: 400 }
      );
    }

    const db = getDB();
    const [existing] = await db.query(
      'SELECT id FROM workspace_members WHERE workspaceId = ? AND userId = ?',
      [workspaceId, targetUserId]
    );
    if ((existing as any[]).length > 0) {
      return NextResponse.json(
        { error: 'User is already a member of this workspace' },
        { status: 400 }
      );
    }

    const [userRows] = await db.query(
      'SELECT id FROM users WHERE id = ?',
      [targetUserId]
    );
    if ((userRows as any[]).length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    await db.query(
      'INSERT INTO workspace_members (workspaceId, userId, role) VALUES (?, ?, ?)',
      [workspaceId, targetUserId, role]
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Add workspace member error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    const db = getDB();
    const [rows] = await db.query(
      `SELECT wm.id, wm.userId, wm.role, wm.joinedAt, u.name as userName
       FROM workspace_members wm
       LEFT JOIN users u ON wm.userId = u.id
       WHERE wm.workspaceId = ?
       ORDER BY wm.role = 'owner' DESC, wm.joinedAt ASC`,
      [workspaceId]
    );

    const members = (rows as any[]).map((r) => ({
      id: r.id,
      userId: r.userId,
      userName: r.userName,
      role: r.role,
      joinedAt: r.joinedAt,
    }));

    return NextResponse.json({ members });
  } catch (error) {
    console.error('Get workspace members error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
