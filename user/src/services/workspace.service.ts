import { db } from "@/lib/db";
import type { Workspace, WorkspaceMember, WorkspaceRole } from "@/domain/workspace";

/**
 * Workspace 생성
 */
export async function createWorkspace(
    name: string,
    ownerId: number,
    description?: string
): Promise<number> {
    const [result] = await db.query(
        `INSERT INTO workspaces (name, description, ownerId, createdAt) 
         VALUES (?, ?, ?, NOW())`,
        [name, description || null, ownerId]
    ) as any;

    const workspaceId = result.insertId;

    // Workspace 생성자는 자동으로 owner로 추가
    await db.query(
        `INSERT INTO workspace_members (workspaceId, userId, role, joinedAt) 
         VALUES (?, ?, 'owner', NOW())`,
        [workspaceId, ownerId]
    );

    return workspaceId;
}

/**
 * Workspace 조회
 */
export async function getWorkspace(workspaceId: number): Promise<Workspace | null> {
    const [rows] = await db.query(
        `SELECT id, name, description, ownerId, createdAt 
         FROM workspaces 
         WHERE id = ?`,
        [workspaceId]
    ) as any[];

    if (!rows || rows.length === 0) {
        return null;
    }

    const row = rows[0];
    return {
        id: row.id,
        name: row.name,
        description: row.description,
        ownerId: row.ownerId,
        createdAt: row.createdAt,
    };
}

/**
 * Workspace 멤버 추가
 */
export async function addWorkspaceMember(
    workspaceId: number,
    userId: number,
    role: WorkspaceRole = "member"
): Promise<void> {
    await db.query(
        `INSERT INTO workspace_members (workspaceId, userId, role, joinedAt) 
         VALUES (?, ?, ?, NOW())`,
        [workspaceId, userId, role]
    );
}

/**
 * Workspace 멤버 제거
 */
export async function removeWorkspaceMember(
    workspaceId: number,
    userId: number
): Promise<void> {
    await db.query(
        `DELETE FROM workspace_members 
         WHERE workspaceId = ? AND userId = ?`,
        [workspaceId, userId]
    );
}

/**
 * Workspace 멤버 역할 변경
 */
export async function updateWorkspaceMemberRole(
    workspaceId: number,
    userId: number,
    role: WorkspaceRole
): Promise<void> {
    await db.query(
        `UPDATE workspace_members 
         SET role = ? 
         WHERE workspaceId = ? AND userId = ?`,
        [role, workspaceId, userId]
    );
}

/**
 * Workspace의 모든 멤버 조회
 */
export async function getWorkspaceMembers(
    workspaceId: number
): Promise<WorkspaceMember[]> {
    const [rows] = await db.query(
        `SELECT id, workspaceId, userId, role, joinedAt 
         FROM workspace_members 
         WHERE workspaceId = ?`,
        [workspaceId]
    ) as any[];

    return rows.map((row: any) => ({
        id: row.id,
        workspaceId: row.workspaceId,
        userId: row.userId,
        role: row.role,
        joinedAt: row.joinedAt,
    }));
}

/**
 * 사용자가 속한 모든 Workspace 조회
 */
export async function getUserWorkspaces(userId: number): Promise<Workspace[]> {
    const [rows] = await db.query(
        `SELECT w.id, w.name, w.description, w.ownerId, w.createdAt 
         FROM workspaces w
         INNER JOIN workspace_members wm ON w.id = wm.workspaceId
         WHERE wm.userId = ?`,
        [userId]
    ) as any[];

    return rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        ownerId: row.ownerId,
        createdAt: row.createdAt,
    }));
}
