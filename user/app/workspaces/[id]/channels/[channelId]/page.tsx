'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useChannelWs } from '@/hooks/useChannelWs';
import MessageInput from '@/components/MessageInput';
import HuddleRoom from '@/components/HuddleRoom';
import { sanitizeHtml } from '@/lib/sanitize';
import { FormattedDate } from '@/components/FormattedDate';

interface Channel {
  id: number;
  name: string;
  displayName?: string;
  workspaceId: number;
}

interface Message {
  id: number;
  content: string;
  channelId: number;
  userId: number;
  userName?: string;
  createdAt: string;
}

export default function ChannelChatPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params?.id as string;
  const channelId = Number(params?.channelId);

  const [channel, setChannel] = useState<Channel | null>(null);
  const [members, setMembers] = useState<{ userId: number; userName: string }[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, setMessages, connected, sendMessage } = useChannelWs(
    channelId && !Number.isNaN(channelId) ? channelId : null,
    token
  );

  const [sending, setSending] = useState(false);
  const [huddleOpen, setHuddleOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Message[] | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!channelId || Number.isNaN(channelId)) {
      setLoading(false);
      setError('Invalid channel');
      return;
    }

    const load = async () => {
      try {
        const [channelRes, tokenRes, messagesRes, membersRes] = await Promise.all([
          fetch(`/api/channels/${channelId}`, { credentials: 'include' }),
          fetch('/api/auth/ws-token', { credentials: 'include' }),
          fetch(`/api/channels/${channelId}/messages`, { credentials: 'include' }),
          fetch(`/api/workspaces/${workspaceId}/members`, { credentials: 'include' }),
        ]);

        if (channelRes.status === 401 || tokenRes.status === 401) {
          router.push('/login');
          return;
        }

        if (!channelRes.ok) throw new Error('Channel not found');
        const chData = await channelRes.json();
        setChannel(chData.channel);

        if (tokenRes.ok) {
          const tData = await tokenRes.json();
          setToken(tData.token);
        }

        if (messagesRes.ok) {
          const mData = await messagesRes.json();
          setMessages(mData.messages || []);
        }

        if (membersRes.ok) {
          const memData = await membersRes.json();
          setMembers((memData.members || []).map((m: { userId: number; userName: string }) => ({ userId: m.userId, userName: m.userName || `User #${m.userId}` })));
        }

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [channelId, workspaceId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `/api/channels/${channelId}/messages?q=${encodeURIComponent(q)}`,
        { credentials: 'include' }
      );
      if (res.ok) {
        const data = await res.json();
        setSearchResults((data.messages || []) as Message[]);
      } else {
        setSearchResults([]);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
  };

  const handleSubmit = async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    if (sending) return;
    setSending(true);
    try {
      if (connected) {
        sendMessage(trimmed);
      } else {
        const res = await fetch(`/api/channels/${channelId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ content: trimmed }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || '전송 실패');
        }
        const data = await res.json();
        const userRes = await fetch('/api/auth/me', { credentials: 'include' });
        const userData = userRes.ok ? await userRes.json() : {};
        setMessages((prev) => [
          ...prev,
          {
            id: data.messageId,
            content: trimmed,
            channelId,
            userId: userData.user?.id ?? 0,
            userName: userData.user?.name,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error || !channel) {
    return (
      <div className="p-6">
        <p className="text-red-600">{error || 'Channel not found'}</p>
        <Link
          href={`/workspaces/${workspaceId}/channels`}
          className="text-gray-600 hover:underline mt-2 inline-block"
        >
          ← 채널 목록
        </Link>
      </div>
    );
  }

  if (huddleOpen) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        <HuddleRoom
          channelId={channelId}
          channelName={channel.displayName || channel.name}
          onLeave={() => setHuddleOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="border-b border-gray-200 px-6 py-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 font-medium">#</span>
            <h1 className="text-lg font-bold text-gray-900">{channel.name}</h1>
            {connected && (
              <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                실시간
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
            type="button"
            onClick={() => setHuddleOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#4A154B] bg-[#4A154B]/10 rounded-md hover:bg-[#4A154B]/20 transition-colors"
            title="허들 시작 (음성/영상 통화)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
            허들
          </button>
          <Link
            href={`/workspaces/${workspaceId}/channels`}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            채널 목록
          </Link>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="메시지 검색..."
            className="flex-1 max-w-xs px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A154B]/50 focus:border-[#4A154B]"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={searching}
            className="px-3 py-1.5 text-sm font-medium text-[#4A154B] border border-[#4A154B] rounded-md hover:bg-[#4A154B]/5 disabled:opacity-50"
          >
            {searching ? '검색 중...' : '검색'}
          </button>
          {searchResults !== null && (
            <button
              type="button"
              onClick={clearSearch}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
            >
              검색 해제
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {searchResults !== null ? (
          <>
            <div className="text-sm text-gray-500 mb-2">
              &quot;{searchQuery}&quot; 검색 결과 {searchResults.length}건
            </div>
            {searchResults.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                검색 결과가 없습니다.
              </div>
            ) : (
              searchResults.map((m) => (
                <div key={m.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#4A154B] flex items-center justify-center text-white text-sm font-semibold shrink-0">
                    {(m.userName || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-gray-900 text-sm">
                        {m.userName || `User #${m.userId}`}
                      </span>
                      <span className="text-xs text-gray-400">
                        <FormattedDate value={m.createdAt} variant="datetime" />
                      </span>
                    </div>
                    <div
                      className="text-gray-800 mt-0.5 break-words [&_b]:font-bold [&_i]:italic [&_u]:underline [&_s]:line-through [&_ul]:list-disc [&_ul]:ml-4 [&_li]:ml-2 [&_ol]:list-decimal [&_ol]:ml-4 [&_blockquote]:border-l-2 [&_blockquote]:border-gray-300 [&_blockquote]:pl-2 [&_blockquote]:text-gray-600 [&_blockquote]:my-1 [&_.mention]:bg-[#4A154B]/10 [&_.mention]:text-[#4A154B] [&_.mention]:px-1 [&_.mention]:rounded"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(m.content) || m.content }}
                    />
                  </div>
                </div>
              ))
            )}
          </>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm">
            메시지가 없습니다. 첫 메시지를 작성해보세요.
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[#4A154B] flex items-center justify-center text-white text-sm font-semibold shrink-0">
                {(m.userName || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-gray-900 text-sm">
                    {m.userName || `User #${m.userId}`}
                  </span>
                  <span className="text-xs text-gray-400">
                    <FormattedDate value={m.createdAt} variant="datetime" />
                  </span>
                </div>
                <div
                  className="text-gray-800 mt-0.5 break-words [&_b]:font-bold [&_i]:italic [&_u]:underline [&_s]:line-through [&_ul]:list-disc [&_ul]:ml-4 [&_li]:ml-2 [&_ol]:list-decimal [&_ol]:ml-4 [&_blockquote]:border-l-2 [&_blockquote]:border-gray-300 [&_blockquote]:pl-2 [&_blockquote]:text-gray-600 [&_blockquote]:my-1 [&_.mention]:bg-[#4A154B]/10 [&_.mention]:text-[#4A154B] [&_.mention]:px-1 [&_.mention]:rounded"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(m.content) || m.content }}
                />
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200">
        <MessageInput
          onSubmit={handleSubmit}
          disabled={sending}
          placeholder={`${channel.name}에 메시지 보내기`}
          members={members}
        />
      </div>
    </div>
  );
}
