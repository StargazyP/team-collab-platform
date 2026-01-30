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

        // 워크스페이스 멤버인지 확인
        const isMember = await isWorkspaceMember(user.id, workspaceId);
        if (!isMember) {
            return NextResponse.json(
                { error: "Forbidden: Not a member of this workspace" },
                { status: 403 }
            );
        }

        const members = await getWorkspaceMembers(workspaceId);
        return NextResponse.json({ members });
    } catch (error: any) {
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
        const { userId, role = "member" } = await req.json();

        if (!userId) {
            return NextResponse.json(
                { error: "userId is required" },
                { status: 400 }
            );
        }

        // 권한 확인: owner 또는 admin만 멤버 추가 가능
        const isOwner = await hasWorkspaceRole(user.id, workspaceId, "owner");
        const isAdmin = await hasWorkspaceRole(user.id, workspaceId, "admin");

        if (!isOwner && !isAdmin) {
            return NextResponse.json(
                { error: "Forbidden: Only owner or admin can add members" },
                { status: 403 }
            );
        }

        // role 검증
        if (!["owner", "admin", "member"].includes(role)) {
            return NextResponse.json(
                { error: "Invalid role. Must be 'owner', 'admin', or 'member'" },
                { status: 400 }
            );
        }

        // owner 역할은 직접 할당 불가 (워크스페이스 생성 시에만)
        if (role === "owner") {
            return NextResponse.json(
                { error: "Cannot assign owner role. Only workspace creator is owner." },
                { status: 400 }
            );
        }

        await addWorkspaceMember(workspaceId, userId, role);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Add workspace member error:", error);
        
        // 중복 멤버 에러 처리
        if (error.code === "ER_DUP_ENTRY") {
            return NextResponse.json(
                { error: "User is already a member of this workspace" },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
