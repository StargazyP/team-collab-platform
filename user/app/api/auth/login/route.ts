import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { RowDataPacket } from "mysql2";

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

        // 1. 사용자 조회
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

        // 2. 비밀번호 검증
        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            return NextResponse.json(
                { error: "Invalid email or password" },
                { status: 401 }
            );
        }

        // 3. 토큰 생성
        const token = jwt.sign(
            { sub: user.id, role: user.role },
            SECRET,
            { expiresIn: "1h" }
        );

        // 4. 응답 및 쿠키 설정
        const res = NextResponse.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });

        res.cookies.set("token", token, {
            httpOnly: true,
            path: "/",
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60, // 1 hour
        });

        return res;
    } catch (error: any) {
        console.error("Login error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
