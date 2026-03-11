'use client';

import { FormattedDate } from '@/components/FormattedDate';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Member {
  id: number;
  userId: number;
  userName?: string;
  role: string;
  joinedAt: string;
}

interface SearchUser {
  id: number;
  name: string;
  email: string;
}

export default function WorkspaceMembersPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = Number(params?.id);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ownerId, setOwnerId] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [removingUserId, setRemovingUserId] = useState<number | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [addingUserId, setAddingUserId] = useState<number | null>(null);
  const [addRole, setAddRole] = useState<'member' | 'admin'>('member');

  const isOwner = ownerId != null && currentUserId !== null && currentUserId === ownerId;

  const searchUsers = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/members/search?q=${encodeURIComponent(q)}`,
        { credentials: 'include' }
      );
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.users || []);
      } else {
        setSearchResults([]);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    const t = setTimeout(() => searchUsers(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery, searchUsers]);

  useEffect(() => {
    if (!workspaceId || Number.isNaN(workspaceId)) {
      setError('Invalid workspace');
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const [membersRes, workspaceRes, meRes] = await Promise.all([
          fetch(`/api/workspaces/${workspaceId}/members`, { credentials: 'include' }),
          fetch(`/api/workspaces/${workspaceId}`, { credentials: 'include' }),
          fetch('/api/auth/me', { credentials: 'include' }),
        ]);
        if (membersRes.status === 401 || workspaceRes.status === 401) {
          router.push('/login');
          return;
        }
        if (!membersRes.ok) throw new Error('Failed to fetch members');
        const membersData = await membersRes.json();
        setMembers(membersData.members || []);
        if (workspaceRes.ok) {
          const wsData = await workspaceRes.json();
          setOwnerId(wsData.workspace?.ownerId ?? null);
        }
        if (meRes.ok) {
          const meData = await meRes.json();
          setCurrentUserId(meData.user?.id ?? null);
        }
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [workspaceId, router]);

  const handleAddMember = async (targetUser: SearchUser) => {
    if (addingUserId !== null) return;
    setAddingUserId(targetUser.id);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUser.id, role: addRole }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMembers((prev) => [
          ...prev,
          {
            id: 0,
            userId: targetUser.id,
            userName: targetUser.name,
            role: addRole,
            joinedAt: new Date().toISOString(),
          },
        ]);
        setSearchResults((prev) => prev.filter((u) => u.id !== targetUser.id));
        setSearchQuery('');
      } else {
        alert(data.error || '멤버 추가에 실패했습니다.');
      }
    } finally {
      setAddingUserId(null);
    }
  };

  const openAddModal = () => {
    setAddModalOpen(true);
    setSearchQuery('');
    setSearchResults([]);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-default-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-foreground">멤버 관리</h1>
        {isOwner && (
          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary-600 transition-colors"
          >
            멤버 추가
          </button>
        )}
      </div>
      {error && (
        <div className="mb-4 p-4 bg-danger-50 border border-danger-200 text-danger-700 rounded-md text-sm">
          {error}
        </div>
      )}
      {members.length === 0 ? (
        <p className="text-default-500">멤버가 없습니다.</p>
      ) : (
        <div className="divide-y divide-default-200 border border-default-200 rounded-lg overflow-hidden">
          {members.map((m) => (
            <div key={m.userId} className="py-4 px-4 flex items-center justify-between bg-background hover:bg-content1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                  {(m.userName || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="font-medium text-foreground">
                    {m.userName || `User #${m.userId}`}
                  </span>
                  <span className="ml-2 text-xs text-default-500">({m.role})</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-default-400">
                  <FormattedDate value={m.joinedAt} variant="date" />
                </span>
                {isOwner && m.role !== 'owner' && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (removingUserId !== null) return;
                      if (!confirm(`${m.userName || '이 멤버'}를 워크스페이스에서 내보내시겠습니까?`)) return;
                      setRemovingUserId(m.userId);
                      try {
                        const res = await fetch(
                          `/api/workspaces/${workspaceId}/members/${m.userId}`,
                          { method: 'DELETE', credentials: 'include' }
                        );
                        if (res.ok) {
                          setMembers((prev) => prev.filter((x) => x.userId !== m.userId));
                        } else {
                          const data = await res.json().catch(() => ({}));
                          alert(data.error || '내보내기에 실패했습니다.');
                        }
                      } finally {
                        setRemovingUserId(null);
                      }
                    }}
                    disabled={removingUserId === m.userId}
                    className="text-xs text-danger-600 hover:text-danger-700 hover:underline disabled:opacity-50"
                  >
                    {removingUserId === m.userId ? '처리 중...' : '내보내기'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/50">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">멤버 추가</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-default-700 mb-2">
                사용자 검색 (이메일 또는 이름)
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="검색어 입력 (2자 이상)"
                className="w-full px-3 py-2 border border-default-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                autoFocus
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-default-700 mb-2">
                역할
              </label>
              <select
                value={addRole}
                onChange={(e) => setAddRole(e.target.value as 'member' | 'admin')}
                className="w-full px-3 py-2 border border-default-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="member">멤버</option>
                <option value="admin">관리자</option>
              </select>
            </div>
            {searchLoading && (
              <div className="text-sm text-default-500 mb-2">검색 중...</div>
            )}
            {searchQuery.length >= 2 && !searchLoading && (
              <div className="mb-4 max-h-48 overflow-y-auto border border-default-200 rounded-md divide-y divide-default-100">
                {searchResults.length === 0 ? (
                  <div className="py-4 px-3 text-sm text-default-500 text-center">
                    검색 결과가 없습니다.
                  </div>
                ) : (
                  searchResults.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between py-3 px-3 hover:bg-content1"
                    >
                      <div>
                        <div className="font-medium text-foreground">{u.name}</div>
                        <div className="text-xs text-default-500">{u.email}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddMember(u)}
                        disabled={addingUserId === u.id}
                        className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {addingUserId === u.id ? '추가 중...' : '추가'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="px-4 py-2 text-default-700 bg-content1 rounded-md hover:bg-content2"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
