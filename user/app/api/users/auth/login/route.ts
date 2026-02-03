import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";

const SECRET = process.env.JWT_SECRET;

type UserRow = {
    id: number;
    name: string;
    email: string;
    password_hash: string;
    role: "user" | "admin";
    permission: string | null;
};

export async function POST(req: NextRequest) {
    const db = getDB();
    if (!SECRET) {
        return NextResponse.json(
            { error: "Server misconfigured: missing JWT_SECRET" },
            { status: 500 }
        );
    }

    const { email, password } = await req.json();

    if (!email || !password) {
        return NextResponse.json(
            { error: "Email and password are required" },
            { status: 400 }
        );
    }

    const [rows] = await db.query(
        `SELECT id, name, email, password_hash, role, permission 
         FROM users 
         WHERE email = ? 
         LIMIT 1`,
        [email]
    );

    const user = (rows as UserRow[])[0];

    if (!user) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = jwt.sign(
        { sub: user.id, role: user.role },
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
            permissions: user.permission ? JSON.parse(user.permission) : [],
        },
    });

    res.cookies.set("token", token, {
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60, // 1h
    });

    return res;
}