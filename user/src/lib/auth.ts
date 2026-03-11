import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { getDB } from "./db";
import { RowDataPacket } from "mysql2";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export interface JWTUser {
  id: number;
  role: string;
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

/**
 * Server Component용: 쿠키에서 토큰을 읽어 사용자 정보 반환
 */
export async function getServerUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;

    const decoded = verifyToken(token);
    const userId = Number(decoded.sub);
    if (!userId) return null;

    const db = getDB();
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT id, name, email, role, permission, created_at FROM users WHERE id = ?",
      [userId]
    );

    return rows[0] || null;
  } catch {
    return null;
  }
}

/**
 * API Route용: 요청 헤더 또는 쿠키에서 사용자 정보 추출
 * - x-user-id / x-user-role 헤더 우선 (프록시 경유 시)
 * - 없으면 쿠키의 token으로 JWT 검증
 */
export async function getUserFromRequest(
  req: NextRequest
): Promise<JWTUser | null> {
  const headerUserId = req.headers.get("x-user-id");
  const headerUserRole = req.headers.get("x-user-role");

  if (headerUserId && headerUserRole) {
    return { id: Number(headerUserId), role: headerUserRole };
  }

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;

    const decoded = verifyToken(token);
    const userId = Number(decoded.sub);
    if (!userId) return null;

    return { id: userId, role: (decoded.role as string) || "user" };
  } catch {
    return null;
  }
}
