export type WorkspaceRole = "owner" | "admin" | "member";

export interface Workspace {
    id: number;
    name: string;
    description?: string;
    ownerId: number;
    createdAt: Date;
}

export interface WorkspaceMember {
    id: number;
    workspaceId: number;
    userId: number;
    role: WorkspaceRole;
    joinedAt: Date;
}