import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getDB } from "@/lib/db";

export async function getServerUser(): Promise<{
    id : number;
    role : "user" | "admin";
} | null> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;
        if(!token){
            return null;
        }
        const payload = await verifyTokenWithVersion(token);
        if (!payload) return null;

        return {
            id: payload.sub,
            role: payload.role,
        };
    }catch(error){
        return null;
    }
}

export type JWTPayload = {
    sub: number; // user id
    role: "user" | "admin";
    v?: number; // tokenVersion - 단일 세션용
    iat?: number;
    exp?: number;
};

export function verifyToken(token: string): JWTPayload {
    const SECRET = process.env.JWT_SECRET;
    if (!SECRET) {
        throw new Error("JWT_SECRET is not configured");
    }
    const decoded = jwt.verify(token, SECRET);
    
    // string 타입이면 에러 (서명된 토큰이어야 함)
    if (typeof decoded === "string") {
        throw new Error("Invalid token format");
    }
    
    // 타입 단언: unknown을 거쳐서 안전하게 변환
    return decoded as unknown as JWTPayload;
}

/**
 * JWT 검증 + tokenVersion 확인 (단일 세션)
 * 다른 환경에서 로그인 시 기존 토큰 무효화
 */
async function verifyTokenWithVersion(token: string): Promise<JWTPayload | null> {
    try {
        const payload = verifyToken(token);
        // v가 없으면 레거시 토큰 - 마이그레이션 기간 허용
        if (payload.v == null) {
            if (process.env.NODE_ENV === "development") {
                console.log("[Auth] 레거시 토큰 (v 없음) - userId:", payload.sub);
            }
            return payload;
        }

        const db = getDB();
        const [rows] = await db.query(
            "SELECT COALESCE(tokenVersion, 0) as tokenVersion FROM users WHERE id = ?",
            [payload.sub]
        );
        const row = (rows as { tokenVersion: number }[])?.[0];
        const dbVersion = row?.tokenVersion ?? 0;
        const tokenVersion = payload.v;

        if (dbVersion !== tokenVersion) {
            if (process.env.NODE_ENV === "development") {
                console.log("[Auth] ❌ 세션 무효 (다른 기기에서 로그인됨) - userId:", payload.sub, "토큰 v:", tokenVersion, "DB v:", dbVersion);
            }
            return null;
        }
        if (process.env.NODE_ENV === "development") {
            console.log("[Auth] ✅ 세션 유효 - userId:", payload.sub, "v:", tokenVersion);
        }
        return payload;
    } catch {
        return null;
    }
}

/**
 * API 라우트에서 현재 인증된 사용자 정보를 가져옵니다.
 * middleware에서 설정한 헤더를 읽어옵니다.
 */
export function getCurrentUser(req: NextRequest): {
    id: number;
    role: "user" | "admin";
} | null {
    const userId = req.headers.get("x-user-id");
    const userRole = req.headers.get("x-user-role");

    if (!userId || !userRole) {
        return null;
    }

    return {
        id: parseInt(userId, 10),
        role: userRole as "user" | "admin",
    };
}

/**
 * API Route 공용. 쿠키 우선(모바일/프록시에서 헤더 누락 대비), 없으면 헤더 사용.
 * 단일 세션: tokenVersion 검증 포함.
 */
export async function getUserFromRequest(req: NextRequest): Promise<{
    id: number;
    role: "user" | "admin";
} | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (token) {
        const payload = await verifyTokenWithVersion(token);
        if (payload) return { id: payload.sub, role: payload.role };
    }
    return getCurrentUser(req);
}
