import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
    getWorkspaceMembers,
    addWorkspaceMember,
} from "@/services/workspace.service";
import { isWorkspaceMember, hasWorkspaceRole } from "@/lib/permissions";

/**
 * GET /api/workspaces/[id]/members - 멤버 목록
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const workspaceId = Number(id);

        const user = getCurrentUser(req);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const isMember = await isWorkspaceMember(user.id, workspaceId);
        if (!isMember) {
            return NextResponse.json(
                { error: "Forbidden: Not a member of this workspace" },
                { status: 403 }
            );
        }

        const members = await getWorkspaceMembers(workspaceId);
        return NextResponse.json({ members });
    } catch (error) {
        console.error("Get workspace members error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/workspaces/[id]/members - 멤버 추가
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const workspaceId = Number(id);

        const user = getCurrentUser(req);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { userId, role = "member" } = await req.json();

        if (!userId) {
            return NextResponse.json(
                { error: "userId is required" },
                { status: 400 }
            );
        }

        const isOwner = await hasWorkspaceRole(user.id, workspaceId, "owner");
        const isAdmin = await hasWorkspaceRole(user.id, workspaceId, "admin");

        if (!isOwner && !isAdmin) {
            return NextResponse.json(
                { error: "Forbidden: Only owner or admin can add members" },
                { status: 403 }
            );
        }

        if (!["admin", "member"].includes(role)) {
            return NextResponse.json(
                { error: "Invalid role" },
                { status: 400 }
            );
        }

        await addWorkspaceMember(workspaceId, userId, role);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Add workspace member error:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return NextResponse.json(
                { error: "User is already a member" },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
