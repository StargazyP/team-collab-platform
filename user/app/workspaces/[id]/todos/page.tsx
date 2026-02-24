'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { sanitizeHtml } from '@/lib/sanitize';
import { FormattedDate } from '@/components/FormattedDate';

interface Todo {
  id: number;
  title: string;
  description?: string;
  status: 'todo' | 'doing' | 'done';
  workspaceId: number;
  createdBy: number;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

interface Workspace {
  id: number;
  name: string;
  ownerId: number;
}

const STATUS_COLUMNS: { value: Todo['status']; label: string }[] = [
  { value: 'todo', label: '할 일' },
  { value: 'doing', label: '진행 중' },
  { value: 'done', label: '완료' },
];

export default function WorkspaceTodosPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = Number(params?.id);

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedNode, setExpandedNode] = useState<Todo['status'] | null>(null);

  const loadData = async () => {
    if (!workspaceId || Number.isNaN(workspaceId)) {
      setError('Invalid workspace');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [wsRes, todosRes, meRes] = await Promise.all([
        fetch(`/api/workspaces/${workspaceId}`, { credentials: 'include' }),
        fetch(`/api/todos?workspaceId=${workspaceId}`, { credentials: 'include' }),
        fetch('/api/auth/me', { credentials: 'include' }),
      ]);
      if (meRes.ok) {
        const meData = await meRes.json();
        setCurrentUserId(meData.user?.id ?? null);
      }
      if (wsRes.status === 401) {
        router.push('/login');
        return;
      }
      if (wsRes.ok) {
        const wsData = await wsRes.json();
        setWorkspace(wsData.workspace);
      }
      if (todosRes.ok) {
        const todosData = await todosRes.json();
        setTodos(todosData.todos || []);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [workspaceId]);

  const handleStatusChange = async (todoId: number, newStatus: Todo['status']) => {
    try {
      const res = await fetch(`/api/todos/${todoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) return;
      await loadData();
    } catch {
      // ignore
    }
  };

  const getTodosByStatus = (status: Todo['status']) =>
    todos.filter((t) => t.status === status);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-gray-500">Loading todos...</div>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="p-6">
        <p className="text-red-600">{error || 'Workspace not found'}</p>
        <Link href={`/workspaces/${workspaceId}`} className="text-gray-600 hover:underline mt-2 inline-block">
          ← 뒤로가기
        </Link>
      </div>
    );
  }

  const canEdit = (todo: Todo) =>
    (currentUserId && workspace && currentUserId === workspace.ownerId) ||
    (currentUserId && currentUserId === todo.createdBy);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">TODO List</h1>
        <Link
          href={`/workspaces/${workspaceId}/todos/new`}
          className="px-4 py-2 bg-[#4A154B] text-white rounded-lg hover:bg-[#611f69] font-medium text-sm transition-colors"
        >
          새글 작성
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-gray-100 border border-gray-200 text-gray-900 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-0 border border-gray-200 rounded-lg overflow-hidden min-h-[400px]">
        <aside className="w-36 shrink-0 border-r border-gray-200 bg-gray-50 py-6 flex flex-col items-center">
          <div className="relative flex flex-col items-center gap-8">
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 -translate-x-1/2 bg-gray-300" />
            {STATUS_COLUMNS.map((col) => {
              const columnTodos = getTodosByStatus(col.value);
              const isExpanded = expandedNode === col.value;
              const circleColors: Record<string, string> = {
                todo: 'bg-gray-400 hover:bg-gray-500 border-gray-500',
                doing: 'bg-[#4A154B] hover:bg-[#611f69] border-[#4A154B]',
                done: 'bg-gray-600 hover:bg-gray-700 border-gray-600',
              };
              return (
                <div key={col.value} className="relative z-10 flex flex-col items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setExpandedNode(isExpanded ? null : col.value)}
                    className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-white font-bold text-xs transition-all ${circleColors[col.value]} ${isExpanded ? 'ring-2 ring-[#4A154B] ring-offset-2 scale-110' : ''}`}
                    title={`${col.label} (${columnTodos.length})`}
                  >
                    {columnTodos.length}
                  </button>
                  <span className="text-xs font-medium text-gray-700">{col.label}</span>
                </div>
              );
            })}
          </div>
        </aside>

        <main className="flex-1 min-w-0 p-6 bg-white overflow-y-auto">
          {expandedNode ? (
            (() => {
              const col = STATUS_COLUMNS.find((c) => c.value === expandedNode)!;
              const columnTodos = getTodosByStatus(expandedNode);
              return (
                <>
                  <div className="pb-3 mb-3 border-b border-gray-200 font-semibold text-gray-900">
                    {col.label} ({columnTodos.length})
                  </div>
                  <div>
                    {columnTodos.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 text-sm">
                        {col.value === 'todo' ? '새 Todo를 추가해보세요' : '비어 있음'}
                      </div>
                    ) : (
                      <div className="space-y-0 divide-y divide-gray-200">
                        {columnTodos.map((todo) => (
                          <div key={todo.id} className="py-3">
                            <h3 className="font-semibold text-gray-900 text-sm">{todo.title}</h3>
                            {todo.description && (
                              <div
                                className="text-xs text-gray-600 mt-1 [&_ul]:list-disc [&_ol]:list-decimal [&_blockquote]:border-l-2 [&_blockquote]:pl-2"
                                dangerouslySetInnerHTML={{ __html: sanitizeHtml(todo.description) }}
                              />
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                              작성자: {todo.createdByName ?? `#${todo.createdBy}`} · <FormattedDate value={todo.createdAt} variant="date" />
                            </p>
                            {canEdit(todo) && (
                              <div className="flex gap-2 mt-2">
                                {todo.status === 'todo' && (
                                  <button
                                    onClick={() => handleStatusChange(todo.id, 'doing')}
                                    className="text-xs px-2 py-1 bg-[#4A154B] text-white rounded hover:bg-[#611f69]"
                                  >
                                    진행 중 →
                                  </button>
                                )}
                                {todo.status === 'doing' && (
                                  <button
                                    onClick={() => handleStatusChange(todo.id, 'done')}
                                    className="text-xs px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                                  >
                                    완료 →
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              );
            })()
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 py-12">
              <p className="text-lg mb-2">좌측 노드를 클릭하세요</p>
              <p className="text-sm">할 일 · 진행 중 · 완료 중 하나를 선택하면 해당 목록이 표시됩니다.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
