import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt, { JwtPayload } from "jsonwebtoken";
import { getDB } from "@/lib/db";
import { RowDataPacket } from "mysql2";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function GET(request: NextRequest) {
    try {
        // 1. 쿠키 가져오기 (await 필수!)
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        // 2. 토큰 검증
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

        // sub는 string일 수 있으므로 number로 변환
        const userId = Number(decoded.sub);
        if (!userId) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        // 3. DB 연결
        const db = getDB();

        // 4. 유저 조회 (비밀번호 제외)
        const [rows] = await db.query<RowDataPacket[]>(
            "SELECT id, name, email, role, permission, created_at FROM users WHERE id = ?",
            [userId]
        );

        const user = rows[0];

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // 5. 결과 반환
        return NextResponse.json({ user });
    } catch (error) {
        console.error("Get user error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
