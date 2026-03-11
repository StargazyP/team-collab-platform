'use client';

import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

/** Slack 스타일 - TODO 리스트 아이콘 (체크리스트) */
function TodoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

/** Slack 스타일 - 멤버 관리 아이콘 */
function MembersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

/** Slack 스타일 - 채널 아이콘 (#) */
function ChannelIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" />
      <line x1="8" y1="7" x2="16" y2="7" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="8" y1="17" x2="12" y2="17" />
    </svg>
  );
}

/** Slack 스타일 - 다이렉트 메시지 아이콘 */
function DmIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

/** Slack 스타일 - 홈/개요 아이콘 */
function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

/** Slack 스타일 - 워크스페이스 아이콘 (사각형) */
function WorkspaceIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  );
}

interface WorkspaceSidebarProps {
  workspaceName?: string;
  workspaceOwnerId?: number;
}

interface Channel {
  id: number;
  name: string;
  description?: string;
}

const NAV_ITEMS = [
  { href: '', label: '개요', icon: HomeIcon },
  { id: 'channels', label: '채널', icon: ChannelIcon },
  { id: 'dm', label: '다이렉트 메시지', icon: DmIcon },
  { href: '/todos', label: 'TODO List', icon: TodoIcon },
  { href: '/members', label: '멤버 관리', icon: MembersIcon },
] as const;

export default function WorkspaceSidebar({ workspaceName, workspaceOwnerId }: WorkspaceSidebarProps) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const workspaceId = params?.id as string;

  const [channelPanelOpen, setChannelPanelOpen] = useState(false);
  const [dmPanelOpen, setDmPanelOpen] = useState(false);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [members, setMembers] = useState<{ userId: number; userName: string }[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(false);
  const [dmLoading, setDmLoading] = useState(false);
  const [showChannelForm, setShowChannelForm] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [deletingChannelId, setDeletingChannelId] = useState<number | null>(null);

  const isOwner = workspaceOwnerId != null && currentUserId !== null && currentUserId === workspaceOwnerId;

  const basePath = `/workspaces/${workspaceId}`;
  const isChannelActive = pathname?.startsWith(`${basePath}/channels`);
  const isDmActive = pathname?.startsWith(`${basePath}/dm`);

  useEffect(() => {
    if (!workspaceId) return;
    fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => data?.user?.id != null && setCurrentUserId(data.user.id))
      .catch(() => {});
  }, [workspaceId]);

  useEffect(() => {
    if (pathname === `${basePath}/channels`) {
      setChannelPanelOpen(true);
    }
  }, [pathname, basePath]);

  useEffect(() => {
    if (pathname?.startsWith(`${basePath}/dm/`)) {
      setDmPanelOpen(true);
    }
  }, [pathname, basePath]);

  const fetchChannels = async () => {
    if (!workspaceId) return;
    setChannelsLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/channels`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setChannels(data.channels || []);
      }
    } catch {
      // ignore
    } finally {
      setChannelsLoading(false);
    }
  };

  useEffect(() => {
    if (channelPanelOpen && workspaceId) {
      fetchChannels();
    }
  }, [channelPanelOpen, workspaceId]);

  const fetchMembers = async () => {
    if (!workspaceId) return;
    setDmLoading(true);
    try {
      const [membersRes, meRes] = await Promise.all([
        fetch(`/api/workspaces/${workspaceId}/members`, { credentials: 'include' }),
        fetch('/api/auth/me', { credentials: 'include' }),
      ]);
      if (membersRes.ok) {
        const data = await membersRes.json();
        setMembers((data.members || []).map((m: { userId: number; userName: string }) => ({ userId: m.userId, userName: m.userName || `User #${m.userId}` })));
      }
      if (meRes.ok) {
        const meData = await meRes.json();
        setCurrentUserId(meData.user?.id ?? null);
      }
    } catch {
      // ignore
    } finally {
      setDmLoading(false);
    }
  };

  useEffect(() => {
    if (dmPanelOpen && workspaceId) {
      fetchMembers();
    }
  }, [dmPanelOpen, workspaceId]);

  const handleOpenDm = async (targetUserId: number) => {
    if (!workspaceId || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/dm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ targetUserId }),
      });
      if (res.ok) {
        const data = await res.json();
        setDmPanelOpen(false);
        router.push(`${basePath}/dm/${data.channelId}`);
      }
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteChannel = async (channelId: number) => {
    if (!workspaceId || deletingChannelId !== null) return;
    if (!confirm('이 채널을 삭제하시겠습니까? 메시지가 모두 삭제됩니다.')) return;
    setDeletingChannelId(channelId);
    try {
      const res = await fetch(`/api/channels/${channelId}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) {
        if (pathname === `${basePath}/channels/${channelId}`) {
          router.push(basePath);
        }
        fetchChannels();
      }
    } catch {
      // ignore
    } finally {
      setDeletingChannelId(null);
    }
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim() || submitting || !workspaceId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newChannelName.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setNewChannelName('');
        setShowChannelForm(false);
        setChannelPanelOpen(false);
        router.push(`${basePath}/channels/${data.channelId}`);
      }
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  if (!workspaceId) return null;

  return (
    <div className="flex shrink-0">
      <aside className="w-[260px] flex flex-col bg-sidebar border-r border-sidebar-border min-h-[calc(100vh-4rem)]">
        <div className="h-12 px-3 flex items-center border-b border-sidebar-border">
          <Link
            href={basePath}
            className="flex items-center gap-2 min-w-0 flex-1"
          >
            <div className="w-8 h-8 rounded flex items-center justify-center bg-sidebar-active shrink-0">
              <WorkspaceIcon className="text-sidebar w-4 h-4" />
            </div>
            <span className="text-sidebar-active font-semibold text-sm truncate">
              {workspaceName || `워크스페이스`}
            </span>
          </Link>
        </div>

        <nav className="flex-1 py-2 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            if ('id' in item && item.id === 'channels') {
              const Icon = item.icon;
              const isActive = isChannelActive;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { setChannelPanelOpen((v) => !v); setDmPanelOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 mx-2 rounded text-sm transition-colors ${
                    isActive
                      ? 'bg-sidebar-hover text-sidebar-active'
                      : 'text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-active'
                  }`}
                >
                  <Icon className="shrink-0 opacity-90" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            }
            if ('id' in item && item.id === 'dm') {
              const Icon = item.icon;
              const isActive = isDmActive;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { setDmPanelOpen((v) => !v); setChannelPanelOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 mx-2 rounded text-sm transition-colors ${
                    isActive
                      ? 'bg-sidebar-hover text-sidebar-active'
                      : 'text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-active'
                  }`}
                >
                  <Icon className="shrink-0 opacity-90" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            }
            const href = item.href;
            const fullHref = href ? `${basePath}${href}` : basePath;
            const isActive =
              href === ''
                ? pathname === basePath
                : pathname?.startsWith(`${basePath}${href}`);
            const Icon = item.icon;
            return (
              <Link
                key={fullHref}
                href={fullHref}
                className={`flex items-center gap-3 px-3 py-2 mx-2 rounded text-sm transition-colors ${
                  isActive
                    ? 'bg-sidebar-hover text-sidebar-active'
                    : 'text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-active'
                }`}
              >
                <Icon className="shrink-0 opacity-90" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* 채널 슬라이드 패널 */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${
          channelPanelOpen ? 'w-[240px]' : 'w-0'
        }`}
      >
        <div className="w-[240px] h-[calc(100vh-4rem)] flex flex-col bg-sidebar-panel border-r border-sidebar-border">
          <div className="px-3 py-2 flex items-center justify-between border-b border-sidebar-border-light">
            <span className="text-sidebar-active font-semibold text-sm">채널</span>
            <button
              type="button"
              onClick={() => setChannelPanelOpen(false)}
              className="text-sidebar-text hover:text-sidebar-active p-1"
              aria-label="닫기"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {channelsLoading ? (
              <div className="px-3 py-4 text-sidebar-text text-sm">로딩 중...</div>
            ) : (
              <>
                {channels.map((ch) => (
                  <div
                    key={ch.id}
                    className={`group flex items-center gap-1 px-3 py-2 text-sm hover:bg-sidebar-hover ${
                      pathname === `${basePath}/channels/${ch.id}`
                        ? 'text-sidebar-active font-medium bg-sidebar-hover'
                        : 'text-sidebar-text'
                    }`}
                  >
                    <Link
                      href={`${basePath}/channels/${ch.id}`}
                      onClick={() => setChannelPanelOpen(false)}
                      className="flex-1 min-w-0 truncate"
                    >
                      # {ch.name}
                    </Link>
                    {isOwner && (
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); handleDeleteChannel(ch.id); }}
                        disabled={deletingChannelId === ch.id}
                        className="shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-sidebar-hover text-sidebar-text hover:text-sidebar-active disabled:opacity-50"
                        aria-label="채널 삭제"
                        title="채널 삭제"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                {showChannelForm ? (
                  <form onSubmit={handleCreateChannel} className="px-3 py-2">
                    <input
                      type="text"
                      value={newChannelName}
                      onChange={(e) => setNewChannelName(e.target.value)}
                      placeholder="채널 이름"
                      className="w-full px-2 py-1.5 text-sm bg-sidebar-input border border-sidebar-border-light rounded text-sidebar-active placeholder:text-sidebar-text-muted"
                      required
                      autoFocus
                    />
                    <div className="flex gap-1 mt-2">
                      <button
                        type="submit"
                        disabled={submitting || !newChannelName.trim()}
                        className="px-2 py-1 text-xs bg-sidebar-active text-sidebar rounded hover:opacity-80 disabled:opacity-50"
                      >
                        생성
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowChannelForm(false); setNewChannelName(''); }}
                        className="px-2 py-1 text-xs text-sidebar-text hover:text-sidebar-active"
                      >
                        취소
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowChannelForm(true)}
                    className="w-full px-3 py-2 text-left text-sm text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-active flex items-center gap-2"
                  >
                    <span className="text-lg">+</span>
                    채널 추가
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* 다이렉트 메시지 슬라이드 패널 */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${
          dmPanelOpen ? 'w-[240px]' : 'w-0'
        }`}
      >
        <div className="w-[240px] h-[calc(100vh-4rem)] flex flex-col bg-sidebar-panel border-r border-sidebar-border">
          <div className="px-3 py-2 flex items-center justify-between border-b border-sidebar-border-light">
            <span className="text-sidebar-active font-semibold text-sm">다이렉트 메시지</span>
            <button
              type="button"
              onClick={() => setDmPanelOpen(false)}
              className="text-sidebar-text hover:text-sidebar-active p-1"
              aria-label="닫기"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {dmLoading ? (
              <div className="px-3 py-4 text-sidebar-text text-sm">로딩 중...</div>
            ) : (
              members.map((m) => (
                <button
                  key={m.userId}
                  type="button"
                  onClick={() => handleOpenDm(m.userId)}
                  disabled={submitting}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-sidebar-hover text-sidebar-text hover:text-sidebar-active flex items-center gap-2 disabled:opacity-50"
                >
                  <span className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold shrink-0">
                    {(m.userName || '?').charAt(0).toUpperCase()}
                  </span>
                  <span>{m.userName}</span>
                  {currentUserId === m.userId && (
                    <span className="text-xs text-default-400">(나)</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
