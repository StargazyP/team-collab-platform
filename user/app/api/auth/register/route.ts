import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";

const SECRET = process.env.JWT_SECRET;

export async function POST(req: NextRequest) {
    if (!SECRET) {
        return NextResponse.json(
            { error: "Server Misconfigured: missing JWT_SECRET" },
            { status: 500 }
        );
    }

    const db = getDB(); // ✅ 요청 시점에 생성

    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
        return NextResponse.json(
            { error: "Name, email, and password are required" },
            { status: 400 }
        );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return NextResponse.json(
            { error: "Invalid email format" },
            { status: 400 }
        );
    }

    if (password.length < 6) {
        return NextResponse.json(
            { error: "Password must be at least 6 characters" },
            { status: 400 }
        );
    }

    try {
        const [existingUsers] = await db.query(
            `SELECT id FROM users WHERE email = ?`,
            [email]
        ) as any[];

        if (existingUsers.length > 0) {
            return NextResponse.json(
                { error: "Email already exists" },
                { status: 409 }
            );
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const [result] = await db.query(
            `INSERT INTO users (name, email, password_hash, role, permission, created_at)
             VALUES (?, ?, ?, 'user', NULL, NOW())`,
            [name, email, passwordHash]
        ) as any;

        const userId = result.insertId;

        const token = jwt.sign(
            { sub: userId, role: "user" },
            SECRET,
            { expiresIn: "1h" }
        );

        const res = NextResponse.json({
            success: true,
            user: {
                id: userId,
                name,
                email,
                role: "user",
                permissions: [],
            },
        });

        res.cookies.set("token", token, {
            httpOnly: true,
            path: "/",
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60,
        });

        return res;
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}



