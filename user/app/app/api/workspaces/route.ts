import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserWorkspaces, createWorkspace } from "@/services/workspace.service";

/**
 * GET /api/workspaces - 내 워크스페이스 목록
 */
export async function GET(req: NextRequest) {
    try {
        const user = getCurrentUser(req);
        if (!user) {
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
        const user = getCurrentUser(req);
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
