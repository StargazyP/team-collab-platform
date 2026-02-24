import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getTodo, updateTodo, deleteTodo } from '@/services/todo.service';
import { isWorkspaceMember, isTodoCreator } from '@/lib/permissions';

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
    const todoId = Number(id);
    if (Number.isNaN(todoId)) {
      return NextResponse.json({ error: 'Invalid todo id' }, { status: 400 });
    }

    const todo = await getTodo(todoId);
    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    const member = await isWorkspaceMember(user.id, todo.workspaceId);
    if (!member) {
      return NextResponse.json(
        { error: 'Forbidden: Not a member of this workspace' },
        { status: 403 }
      );
    }

    return NextResponse.json({ todo });
  } catch (error) {
    console.error('Get todo error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const todoId = Number(id);
    if (Number.isNaN(todoId)) {
      return NextResponse.json({ error: 'Invalid todo id' }, { status: 400 });
    }

    const todo = await getTodo(todoId);
    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    const creator = await isTodoCreator(user.id, todoId);
    if (!creator) {
      return NextResponse.json(
        { error: 'Forbidden: Only creator can update todo' },
        { status: 403 }
      );
    }

    const updates = await req.json();
    await updateTodo(todoId, updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update todo error:', error);
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
    const todoId = Number(id);
    if (Number.isNaN(todoId)) {
      return NextResponse.json({ error: 'Invalid todo id' }, { status: 400 });
    }

    const todo = await getTodo(todoId);
    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    const creator = await isTodoCreator(user.id, todoId);
    if (!creator) {
      return NextResponse.json(
        { error: 'Forbidden: Only creator can delete todo' },
        { status: 403 }
      );
    }

    await deleteTodo(todoId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete todo error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
