'use client';

import Link from 'next/link';
import NotificationBell from './NotificationBell';

interface WorkspaceHeaderProps {
  workspaceId: string;
}

export default function WorkspaceHeader({ workspaceId }: WorkspaceHeaderProps) {
  return (
    <header className="h-12 border-b border-default-200 bg-background px-4 flex items-center justify-between">
      <Link
        href="/workspaces"
        className="text-default-600 hover:text-foreground text-sm font-medium flex items-center gap-1"
      >
        <span>←</span>
        <span>워크스페이스 목록</span>
      </Link>
      <div className="flex items-center gap-2">
        <NotificationBell workspaceId={workspaceId} />
        <Link
          href="/mypage"
          className="w-9 h-9 rounded-full bg-content2 flex items-center justify-center hover:bg-default-300 transition-colors shrink-0"
          title="마이페이지"
          aria-label="마이페이지"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </Link>
      </div>
    </header>
  );
}
