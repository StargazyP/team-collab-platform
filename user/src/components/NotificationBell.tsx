'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useNotificationWs, type Notification } from '@/hooks/useNotificationWs';

interface NotificationBellProps {
  workspaceId: string;
}

export default function NotificationBell({ workspaceId }: NotificationBellProps) {
  const { notifications, unreadCount, clearUnread, mergeFromApi } =
    useNotificationWs(Number(workspaceId));
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = async () => {
    setOpen((v) => !v);
    if (!open) {
      try {
        const res = await fetch('/api/notifications', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          mergeFromApi(data.notifications || []);
        }
      } catch { /* ignore */ }
      clearUnread();
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${Math.floor(diffHr / 24)}d ago`;
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative w-9 h-9 rounded-full bg-content1 flex items-center justify-center hover:bg-content2 transition-colors"
        aria-label="알림"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-danger-500 text-white text-[10px] font-medium flex items-center justify-center px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 max-h-96 overflow-y-auto bg-background border border-default-200 rounded-lg shadow-lg z-50">
          <div className="px-4 py-3 border-b border-default-100">
            <span className="text-sm font-medium text-foreground">Notifications</span>
          </div>
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-default-400">
              No notifications
            </div>
          ) : (
            <div>
              {notifications.map((n: Notification) => (
                <Link
                  key={n.id}
                  href={`/workspaces/${workspaceId}/channels/${n.channelId}`}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-3 hover:bg-content1 border-b border-default-100 last:border-0 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <div className="w-7 h-7 rounded-full bg-content2 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-medium text-default-600">
                        {n.senderName?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">
                        <span className="font-medium">{n.senderName}</span>
                        {' in '}
                        <span className="text-default-500">#{n.channelName}</span>
                      </p>
                      <p className="text-xs text-default-500 truncate mt-0.5">
                        {n.contentPreview}
                      </p>
                      <p className="text-[11px] text-default-400 mt-1">
                        {formatTime(n.createdAt)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
