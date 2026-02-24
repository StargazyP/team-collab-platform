import { getDB } from "@/lib/db";

export interface WorkspaceRow {
  id: number;
  name: string;
  description: string | null;
  ownerId: number;
  createdAt: Date;
}

export async function getUserWorkspaces(userId: number): Promise<WorkspaceRow[]> {
  const db = getDB();
  const [rows] = await db.query(
    `SELECT w.id, w.name, w.description, w.ownerId, w.createdAt
     FROM workspaces w
     INNER JOIN workspace_members wm ON w.id = wm.workspaceId
     WHERE wm.userId = ?
     ORDER BY w.createdAt DESC`,
    [userId]
  );
  return (rows as WorkspaceRow[]) || [];
}

/** 워크스페이스 멤버 userId 목록 (알림 수신 대상 등) */
export async function getWorkspaceMemberUserIds(workspaceId: number): Promise<number[]> {
  const db = getDB();
  const [rows] = await db.query(
    'SELECT userId FROM workspace_members WHERE workspaceId = ?',
    [workspaceId]
  );
  return ((rows as { userId: number }[]) || []).map((r) => r.userId);
}

export async function getWorkspaceById(id: number): Promise<WorkspaceRow | null> {
  const db = getDB();
  const [rows] = await db.query(
    "SELECT id, name, description, ownerId, createdAt FROM workspaces WHERE id = ?",
    [id]
  );
  const arr = rows as WorkspaceRow[];
  return arr?.[0] ?? null;
}

export async function createWorkspace(
  name: string,
  ownerId: number,
  description?: string
): Promise<number> {
  const db = getDB();
  const [result] = await db.query(
    "INSERT INTO workspaces (name, description, ownerId) VALUES (?, ?, ?)",
    [name, description || null, ownerId]
  );
  const insertId = (result as { insertId: number }).insertId;
  await db.query(
    "INSERT INTO workspace_members (workspaceId, userId, role) VALUES (?, ?, 'owner')",
    [insertId, ownerId]
  );
  return insertId;
}
