import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

/**
 * ✅ 앱 전역 JWT Payload 타입 (단 하나)
 */
export type JWTPayload = {
  sub: number;
  role: "user" | "admin";
  iat?: number;
  exp?: number;
};

/**
 * 🔐 토큰 검증 (middleware / server 공용)
 */
export function verifyToken(token: string): JWTPayload {
  const SECRET = process.env.JWT_SECRET;
  if (!SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  const decoded = jwt.verify(token, SECRET);

  if (typeof decoded === "string") {
    throw new Error("Invalid token format");
  }

  // ✅ 핵심 포인트 (unknown 경유)
  return decoded as unknown as JWTPayload;
}

/**
 * 🧠 Server Component 전용 (cookies 사용)
 */
export async function getServerUser(): Promise<{
    id: number;
    role: "user" | "admin";
  } | null> {
    const cookieStore = await cookies(); // ✅ 여기 핵심
    const token = cookieStore.get("token")?.value;
  
    if (!token) return null;
  
    try {
      const payload = verifyToken(token);
  
      return {
        id: payload.sub,
        role: payload.role,
      };
    } catch {
      return null;
    }
  }
  

/**
 * 🌐 API Route 전용 (middleware header 기반)
 */
export function getCurrentUser(req: NextRequest): {
  id: number;
  role: "user" | "admin";
} | null {
  const userId = req.headers.get("x-user-id");
  const userRole = req.headers.get("x-user-role");

  if (!userId || !userRole) return null;

  return {
    id: Number(userId),
    role: userRole as "user" | "admin",
  };
}

