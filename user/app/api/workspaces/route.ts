import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth"; // ✅ 여기 주목
import { getUserWorkspaces, createWorkspace } from "@/services/workspace.service";

/**
 * GET /api/workspaces - 내 워크스페이스 목록
 */
export async function GET(req: NextRequest) {
    try {
        console.log("🔍 [GET /api/workspaces] Request received");
        console.log("🔍 [GET /api/workspaces] Request headers:", Object.fromEntries(req.headers.entries()));
        
        // Try method 1: Get user from injected headers (middleware)
        const user = await getUserFromRequest(req);
        
        // If headers not injected, fall back to reading token from cookie directly
    
        
        if (!user) {
            console.log("❌ [GET /api/workspaces] No user - returning 401");
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const workspaces = await getUserWorkspaces(user.id);
        return NextResponse.json({ workspaces });
    } catch (error: any) {
        console.error("Get workspaces error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/workspaces - 워크스페이스 생성
 */
export async function POST(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { name, description } = await req.json();

        if (!name) {
            return NextResponse.json(
                { error: "Name is required" },
                { status: 400 }
            );
        }

        const workspaceId = await createWorkspace(name, user.id, description);

        return NextResponse.json({
            success: true,
            workspaceId,
        });
    } catch (error: any) {
        console.error("Create workspace error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
