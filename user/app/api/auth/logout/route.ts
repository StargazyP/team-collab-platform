import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
    try {
        const cookieStore = await cookies();

        // Delete the token cookie
        cookieStore.delete("token");

        return NextResponse.json({ message: "Logged out successfully" });
    } catch (error) {
        console.error("Logout error:", error);
        return NextResponse.json(
            { error: "Logout failed" },
            { status: 500 }
        );
    }
}
