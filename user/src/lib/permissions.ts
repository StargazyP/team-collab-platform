import { getCurrentUser } from "@/lib/auth";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";

export type Permission = 
    | "USER_READ"
    | "USER_WRITE"
    | "USER_DELETE"
    | "USER_UPDATE"
    | "USER_CREATE"
    | "USER_READ_ALL"
    | "USER_WRITE_ALL"
    | "USER_DELETE_ALL"
    | "USER_UPDATE_ALL"
    | "USER_CREATE_ALL"
    | "WORKSPACE_READ"
    | "WORKSPACE_WRITE"
    | "WORKSPACE_DELETE"
    | "WORKSPACE_MEMBER_MANAGE"
    | "TODO_READ"
    | "TODO_WRITE"
    | "TODO_DELETE"
    | "TODO_ASSIGN";

/**
 * Service 레벨에서 권한을 체크하는 함수
 * @param req NextRequest 객체
 * @param requiredPermission 필요한 권한
 * @returns 권한이 있으면 true, 없으면 false
 */
export async function checkPermission(
    req: NextRequest,
    requiredPermission: Permission
): Promise<boolean> {
    const user = getCurrentUser(req);
    if (!user) {
        return false;
    }

    // Admin은 모든 권한을 가짐
    if (user.role === "admin") {
        return true;
    }

    // User의 경우 권한을 DB에서 확인
    const [rows] = await db.query(
        `SELECT permission FROM users WHERE id = ?`,
        [user.id]
    ) as any[];

    if (!rows || rows.length === 0) {
        return false;
    }

    const permissions: Permission[] = rows[0].permission
        ? JSON.parse(rows[0].permission)
        : [];

    return permissions.includes(requiredPermission);
}

/**
 * Workspace 멤버인지 확인
 * @param userId 사용자 ID
 * @param workspaceId 워크스페이스 ID
 * @returns 멤버이면 true, 아니면 false
 */
export async function isWorkspaceMember(
    userId: number,
    workspaceId: number
): Promise<boolean> {
    const [rows] = await db.query(
        `SELECT id FROM workspace_members 
         WHERE userId = ? AND workspaceId = ?`,
        [userId, workspaceId]
    ) as any[];

    return rows && rows.length > 0;
}

/**
 * Workspace의 특정 역할을 가진 멤버인지 확인
 * @param userId 사용자 ID
 * @param workspaceId 워크스페이스 ID
 * @param role 확인할 역할
 * @returns 해당 역할이면 true, 아니면 false
 */
export async function hasWorkspaceRole(
    userId: number,
    workspaceId: number,
    role: "owner" | "admin" | "member"
): Promise<boolean> {
    const [rows] = await db.query(
        `SELECT role FROM workspace_members 
         WHERE userId = ? AND workspaceId = ?`,
        [userId, workspaceId]
    ) as any[];

    if (!rows || rows.length === 0) {
        return false;
    }

    return rows[0].role === role;
}

/**
 * Todo의 담당자인지 확인
 * @param userId 사용자 ID
 * @param todoId Todo ID
 * @returns 담당자이면 true, 아니면 false
 */
export async function isTodoAssignee(
    userId: number,
    todoId: number
): Promise<boolean> {
    const [rows] = await db.query(
        `SELECT assignedTo FROM todos WHERE id = ?`,
        [todoId]
    ) as any[];

    if (!rows || rows.length === 0) {
        return false;
    }

    return rows[0].assignedTo === userId;
}

/**
 * Todo를 생성한 사용자인지 확인
 * @param userId 사용자 ID
 * @param todoId Todo ID
 * @returns 생성자이면 true, 아니면 false
 */
export async function isTodoCreator(
    userId: number,
    todoId: number
): Promise<boolean> {
    const [rows] = await db.query(
        `SELECT createdBy FROM todos WHERE id = ?`,
        [todoId]
    ) as any[];

    if (!rows || rows.length === 0) {
        return false;
    }

    return rows[0].createdBy === userId;
}
