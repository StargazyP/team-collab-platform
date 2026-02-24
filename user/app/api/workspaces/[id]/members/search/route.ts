import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getWorkspaceById } from '@/services/workspace.service';
import { getDB } from '@/lib/db';

type Params = { id: string };

/**
 * GET /api/workspaces/[id]/members/search?q=xxx
 * 워크스페이스에 아직 멤버가 아닌 사용자를 이메일/이름으로 검색
 * 오너만 호출 가능
 */
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

    const workspace = await getWorkspaceById(workspaceId);
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    if (workspace.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: Only workspace owner can search for members' },
        { status: 403 }
      );
    }

    const q = req.nextUrl.searchParams.get('q')?.trim() || '';
    if (q.length < 2) {
      return NextResponse.json({ users: [] });
    }

    const db = getDB();
    const searchPattern = `%${q}%`;
    const [rows] = await db.query(
      `SELECT u.id, u.name, u.email
       FROM users u
       WHERE (u.email LIKE ? OR u.name LIKE ?)
       AND u.id NOT IN (
         SELECT userId FROM workspace_members WHERE workspaceId = ?
       )
       ORDER BY u.name ASC
       LIMIT 10`,
      [searchPattern, searchPattern, workspaceId]
    );

    const users = (rows as { id: number; name: string; email: string }[]).map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
    }));

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Search users for workspace error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
