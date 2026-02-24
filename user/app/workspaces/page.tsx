'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Workspace {
  id: number;
  name: string;
  description?: string;
  ownerId: number;
  createdAt: string;
}

export default function WorkspacesPage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchWorkspaces = async () => {
    try {
      const res = await fetch('/api/workspaces', { credentials: 'include' });
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setWorkspaces(data.workspaces || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || submitting) return;
    try {
      setSubmitting(true);
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() || undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create');
      }
      const data = await res.json();
      setNewName('');
      setNewDesc('');
      setShowForm(false);
      router.push(`/workspaces/${data.workspaceId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-900">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">워크스페이스</h1>
            <p className="text-sm text-gray-600 mt-0.5">내 워크스페이스 목록</p>
          </div>
          <Link
            href="/mypage"
            className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
            title="마이페이지"
            aria-label="마이페이지"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </Link>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="mb-6 px-4 py-2 bg-[#4A154B] text-white rounded-md hover:bg-[#611f69] font-medium"
          >
            + 새 워크스페이스
          </button>
        ) : (
          <form onSubmit={handleCreate} className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="워크스페이스 이름"
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 mb-2"
              required
              autoFocus
            />
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="설명 (선택)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 text-sm mb-3"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting || !newName.trim()}
                className="px-4 py-2 bg-[#4A154B] text-white rounded-md hover:bg-[#611f69] disabled:opacity-50"
              >
                {submitting ? '생성 중...' : '생성'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setNewName(''); setNewDesc(''); }}
                className="px-4 py-2 border border-gray-300 bg-white text-gray-900 rounded-md hover:bg-gray-50"
              >
                취소
              </button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {workspaces.length === 0 ? (
            <div className="text-center py-12 text-gray-500">워크스페이스가 없습니다.</div>
          ) : (
            workspaces.map((ws) => (
              <Link
                key={ws.id}
                href={`/workspaces/${ws.id}`}
                className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                <h3 className="font-semibold text-gray-900">{ws.name}</h3>
                {ws.description && <p className="text-sm text-gray-600 mt-1">{ws.description}</p>}
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
