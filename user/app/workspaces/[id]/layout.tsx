import { ReactNode } from 'react';
import WorkspaceSidebar from '@/components/WorkspaceSidebar';
import WorkspaceHeader from '@/components/WorkspaceHeader';
import { HuddleLayoutProvider } from '@/contexts/HuddleLayoutContext';
import HuddleLayoutWrapper from '@/components/HuddleLayoutWrapper';
import { getWorkspaceById } from '@/services/workspace.service';

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ id: string }>;
}

export default async function WorkspaceLayout({ children, params }: LayoutProps) {
  const { id } = await params;
  const workspaceId = Number(id);
  let workspaceName = '';
  let workspaceOwnerId: number | undefined;

  if (!Number.isNaN(workspaceId)) {
    try {
      const ws = await getWorkspaceById(workspaceId);
      workspaceName = ws?.name ?? '';
      workspaceOwnerId = ws?.ownerId;
    } catch {
      // ignore
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <WorkspaceHeader workspaceId={String(id)} />
      <div className="flex">
        <WorkspaceSidebar workspaceName={workspaceName} workspaceOwnerId={workspaceOwnerId} />
        <main className="flex-1 min-w-0 bg-[#ffffff] min-h-[calc(100vh-4rem)] relative flex flex-col">
          <HuddleLayoutProvider>
            <HuddleLayoutWrapper
              workspaceId={String(id)}
              workspaceName={workspaceName}
            >
              {children}
            </HuddleLayoutWrapper>
          </HuddleLayoutProvider>
        </main>
      </div>
    </div>
  );
}
