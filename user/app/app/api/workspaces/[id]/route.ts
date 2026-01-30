import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getWorkspace } from "@/services/workspace.service";
import { isWorkspaceMember } from "@/lib/permissions";

/**
 * GET /api/workspaces/[id] - 워크스페이스 조회
 */
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = getCurrentUser(req);
        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const workspaceId = Number(params.id);
        const workspace = await getWorkspace(workspaceId);

        if (!workspace) {
            return NextResponse.json(
                { error: "Workspace not found" },
                { status: 404 }
            );
        }

        // 워크스페이스 멤버인지 확인
        const isMember = await isWorkspaceMember(user.id, workspaceId);
        if (!isMember) {
            return NextResponse.json(
                { error: "Forbidden: Not a member of this workspace" },
                { status: 403 }
            );
        }

        return NextResponse.json({ workspace });
    } catch (error: any) {
        console.error("Get workspace error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
