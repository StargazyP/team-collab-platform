import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getWorkspaceById } from '@/services/workspace.service';
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

    const workspace = await getWorkspaceById(workspaceId);
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const member = await isWorkspaceMember(user.id, workspaceId);
    if (!member) {
      return NextResponse.json(
        { error: 'Forbidden: Not a member of this workspace' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      workspace: {
        id: workspace.id,
        name: workspace.name,
        description: workspace.description,
        ownerId: workspace.ownerId,
      },
    });
  } catch (error) {
    console.error('Get workspace error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
