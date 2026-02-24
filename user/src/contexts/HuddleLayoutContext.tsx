'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface HuddleLayoutState {
  inHuddle: boolean;
  workspaceId: number | null;
  workspaceName: string;
}

interface HuddleLayoutContextValue extends HuddleLayoutState {
  enterHuddle: (workspaceId: number, workspaceName: string) => void;
  leaveHuddle: () => void;
}

const HuddleLayoutContext = createContext<HuddleLayoutContextValue | null>(null);

export function HuddleLayoutProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [state, setState] = useState<HuddleLayoutState>({
    inHuddle: false,
    workspaceId: null,
    workspaceName: '',
  });

  const enterHuddle = useCallback((workspaceId: number, workspaceName: string) => {
    setState({ inHuddle: true, workspaceId, workspaceName });
  }, []);

  const leaveHuddle = useCallback(() => {
    setState({ inHuddle: false, workspaceId: null, workspaceName: '' });
  }, []);

  const value: HuddleLayoutContextValue = {
    ...state,
    enterHuddle,
    leaveHuddle,
  };

  return (
    <HuddleLayoutContext.Provider value={value}>
      {children}
    </HuddleLayoutContext.Provider>
  );
}

export function useHuddleLayout() {
  const ctx = useContext(HuddleLayoutContext);
  if (!ctx) {
    return {
      inHuddle: false,
      workspaceId: null,
      workspaceName: '',
      enterHuddle: (_wId: number, _wName: string) => {},
      leaveHuddle: () => {},
    };
  }
  return ctx;
}
