'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useNotificationWs } from '@/hooks/useNotificationWs';

interface NotificationBellProps {
  workspaceId: string;
}

export default function NotificationBell({ workspaceId }: NotificationBellProps) {
  const { notifications, unreadCount, clearUnread, removeNotification, mergeNotifications } =
    useNotificationWs(workspaceId);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        mergeNotifications(data.notifications || []);
      }
    } catch {
      // ignore
    }
  }, [mergeNotifications]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, fetchNotifications]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          if (open) clearUnread();
        }}
        className="relative w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
        title="알림"
        aria-label="알림"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 max-h-96 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-2">
          <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
            <span className="font-semibold text-gray-900">알림</span>
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={clearUnread}
                className="text-xs text-[#4A154B] hover:underline"
              >
                모두 읽음
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">
              알림이 없습니다.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((n) => (
                <Link
                  key={n.id}
                  href={`/workspaces/${workspaceId}/channels/${n.channelId}`}
                  onClick={() => {
                    removeNotification(n.id);
                    setOpen(false);
                  }}
                  className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex gap-2">
                    <span className="font-semibold text-gray-900 shrink-0">
                      {n.senderName}
                    </span>
                    <span className="text-gray-500 text-sm shrink-0">님이 멘션했습니다</span>
                  </div>
                  <p className="text-sm text-gray-700 mt-0.5 line-clamp-2">
                    {n.contentPreview || '(메시지)'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    #{n.channelName}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
