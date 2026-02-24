'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useHuddleLayout } from '@/contexts/HuddleLayoutContext';

interface Workspace {
  id: number;
  name: string;
  description?: string;
  ownerId: number;
}

export default function WorkspaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = Number(params?.id);
  const { enterHuddle } = useHuddleLayout();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId || Number.isNaN(workspaceId)) {
      setError('Invalid workspace');
      setLoading(false);
      return;
    }
    const fetchWorkspace = async () => {
      try {
        const res = await fetch(`/api/workspaces/${workspaceId}`, { credentials: 'include' });
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setWorkspace(data.workspace);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchWorkspace();
  }, [workspaceId, router]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="p-6">
        <p className="text-red-600">{error || 'Workspace not found'}</p>
        <Link href="/workspaces" className="text-gray-600 hover:underline mt-2 inline-block">
          ← 워크스페이스 목록
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-900">{workspace.name}</h1>
      {workspace.description && (
        <p className="text-gray-600 mt-2">{workspace.description}</p>
      )}
      <div className="mt-6 flex items-center gap-4">
        <button
          type="button"
          onClick={() => enterHuddle(workspace.id, workspace.name)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#4A154B] text-white rounded-lg hover:bg-[#611f69] transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
          </svg>
          허들 입장
        </button>
      </div>
      <p className="text-sm text-gray-500 mt-6">
        좌측 사이드바에서 TODO List 또는 멤버 관리로 이동할 수 있습니다.
      </p>
    </div>
  );
}
