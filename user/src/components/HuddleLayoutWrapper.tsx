'use client';

import { ReactNode, useState } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import HuddleRoom from '@/components/HuddleRoom';
import { useHuddleLayout } from '@/contexts/HuddleLayoutContext';

interface HuddleLayoutWrapperProps {
  children: ReactNode;
  workspaceId: string;
  workspaceName: string;
}

export default function HuddleLayoutWrapper({
  children,
  workspaceId,
  workspaceName,
}: HuddleLayoutWrapperProps) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { inHuddle, workspaceId: huddleWorkspaceId, leaveHuddle } = useHuddleLayout();

  const [isSpeaking, setIsSpeaking] = useState(false);
  const isCurrentWorkspace = String(huddleWorkspaceId) === id;
  const basePath = `/workspaces/${id}`;
  const isWorkspaceRoot = pathname === basePath;
  const showFullHuddle = inHuddle && isCurrentWorkspace && isWorkspaceRoot;
  const showPip = inHuddle && isCurrentWorkspace && !isWorkspaceRoot;

  const goToHuddle = () => {
    router.push(basePath);
  };

  return (
    <>
      {!showFullHuddle && children}
      {inHuddle && (
        <div
          role={showPip ? 'button' : undefined}
          tabIndex={showPip ? 0 : undefined}
          onClick={showPip ? goToHuddle : undefined}
          onKeyDown={showPip ? (e) => e.key === 'Enter' && goToHuddle() : undefined}
          className={
            showFullHuddle
              ? 'flex flex-col flex-1 min-h-0 min-w-0'
              : `fixed top-16 right-4 z-50 w-64 h-44 rounded-lg overflow-hidden shadow-xl bg-gray-900 cursor-pointer transition-all ${
                  showPip && isSpeaking
                    ? 'ring-[3px] ring-green-500 border-2 border-green-500/80 shadow-[0_0_12px_rgba(34,197,94,0.5)]'
                    : 'border-2 border-[#4A154B] hover:ring-2 hover:ring-[#4A154B]'
                }`
          }
          aria-label={showPip ? '허들로 돌아가기' : undefined}
        >
          {showPip && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-10 pointer-events-none rounded-lg">
              <span className="text-white text-xs font-medium drop-shadow">클릭 → 허들로 이동</span>
            </div>
          )}
          <HuddleRoom
            workspaceId={Number(workspaceId)}
            workspaceName={workspaceName}
            onLeave={leaveHuddle}
            pip={showPip}
            onSpeakingChange={setIsSpeaking}
          />
        </div>
      )}
    </>
  );
}
