import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getWorkspaceTodos, createTodo } from '@/services/todo.service';
import { isWorkspaceMember } from '@/lib/permissions';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = Number(searchParams.get('workspaceId'));
    if (!workspaceId || Number.isNaN(workspaceId)) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    const member = await isWorkspaceMember(user.id, workspaceId);
    if (!member) {
      return NextResponse.json(
        { error: 'Forbidden: Not a member of this workspace' },
        { status: 403 }
      );
    }

    const todos = await getWorkspaceTodos(workspaceId);
    return NextResponse.json({ todos });
  } catch (error) {
    console.error('Get todos error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, workspaceId } = body;

    if (!title || !workspaceId) {
      return NextResponse.json(
        { error: 'title and workspaceId are required' },
        { status: 400 }
      );
    }

    const member = await isWorkspaceMember(user.id, workspaceId);
    if (!member) {
      return NextResponse.json(
        { error: 'Forbidden: Not a member of this workspace' },
        { status: 403 }
      );
    }

    const id = await createTodo({
      title: String(title).trim(),
      description: description ? String(description).trim() : undefined,
      workspaceId: Number(workspaceId),
      createdBy: user.id,
    });

    return NextResponse.json({ success: true, todoId: id });
  } catch (error) {
    console.error('Create todo error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
