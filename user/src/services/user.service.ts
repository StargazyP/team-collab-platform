import { getDB } from "@/lib/db";
import { checkPermission } from "@/lib/permissions";
import { RowDataPacket } from "mysql2";
import { NextRequest } from "next/server";
const db = getDB();
/**
 * 사용자 이름 업데이트 (권한 체크 포함)
 */
export async function updateName(
    req: NextRequest,
    id: number,
    name: string
): Promise<void> {
    // 자신의 이름을 변경하거나 USER_UPDATE 권한이 있어야 함
    const user = await getCurrentUserFromRequest(req);
    if (!user) {
        throw new Error("Unauthorized");
    }

    // 자신의 이름을 변경하는 경우는 허용
    if (user.id === id) {
        await db.query("UPDATE users SET name = ? WHERE id = ?", [name, id]);
        return;
    }
    // 다른 사용자의 이름을 변경하려면 권한 필요
    const hasPermission = await checkPermission(req, "USER_UPDATE");
    if (!hasPermission) {
        throw new Error("Forbidden: USER_UPDATE permission required");
    }

    await db.query("UPDATE users SET name = ? WHERE id = ?", [name, id]);
}

/**
 * 사용자 삭제 (권한 체크 포함)
 */
export async function deleteUser(req: NextRequest, id: number): Promise<void> {
    const hasPermission = await checkPermission(req, "USER_DELETE");
    if (!hasPermission) {
        throw new Error("Forbidden : USER_DELETE permission required");
    }
    await db.query("DELETE FROM users WHERE id = ?", [id]);
}

/**
 * 헬퍼 함수: Request에서 현재 사용자 정보 가져오기
 */
async function getCurrentUserFromRequest(req: NextRequest) {
    const userId = req.headers.get("x-user-id");
    const userRole = req.headers.get('x-user-role');

    if (!userId || !userRole) {
        return null;
    }
    return {
        id: parseInt(userId, 10),
        role: userRole as "user" | "admin",
    };
}
/*
getUserById 함수 : mypage로 유저 정보 가져오기*/

export async function getUserById(id: number) {
    const [rows] = await db.query<RowDataPacket[]>("SELECT id, name, email, role, permission, created_at FROM users WHERE id = ?", [id]);
    return rows[0]; // 단일 객체 반환
}
