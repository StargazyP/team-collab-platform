import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { getAuthCookieOptions } from "@/lib/cookie";

const SECRET = process.env.JWT_SECRET;

export async function POST(req: NextRequest) {
  const db = getDB();

  if (!SECRET) {
    return NextResponse.json(
      { error: "Server Misconfigured: missing JWT_SECRET" },
      { status: 500 }
    );
  }

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const [users] = await db.query<RowDataPacket[]>(
      "SELECT id, name, email, password_hash, role FROM users WHERE email = ?",
      [email]
    );

    const user = users[0];
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // 단일 세션: 다른 외부 IP(다른 기기)에서 로그인 시
    // 1. 인증 완료 후 tokenVersion 증가 → 이전 모든 로그인 세션(이전 기기) 무효화
    // 2. 새 JWT 발급 → 현재 요청(외부 세션)만 유효. 이전 기기는 다음 요청 시 401/리다이렉트
    await db.query(
      "UPDATE users SET tokenVersion = COALESCE(tokenVersion, 0) + 1 WHERE id = ?",
      [user.id]
    );
    const [versionRows] = await db.query<RowDataPacket[]>(
      "SELECT COALESCE(tokenVersion, 0) as tokenVersion FROM users WHERE id = ?",
      [user.id]
    );
    const tokenVersion = (versionRows[0]?.tokenVersion as number) ?? 1;

    const token = jwt.sign(
      { sub: user.id, role: user.role, v: tokenVersion },
      SECRET,
      { expiresIn: "1h" }
    );

    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    // ✅ 환경별 쿠키 옵션 적용
    res.cookies.set("token", token, getAuthCookieOptions());

    console.log("✅ [Login] Token cookie set:", getAuthCookieOptions());
    return res;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
