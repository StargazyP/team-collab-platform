import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getTodo, assignTodo } from "@/services/todo.service";
import {
    isWorkspaceMember,
    isTodoCreator,
    hasWorkspaceRole,
} from "@/lib/permissions";

/**
 * PATCH /api/todos/[id]/assign - Todo 담당자 할당
 */
export async function PATCH(
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

        const todoId = Number(params.id);
        const { assignedTo } = await req.json();

        const todo = await getTodo(todoId);

        if (!todo) {
            return NextResponse.json(
                { error: "Todo not found" },
                { status: 404 }
            );
        }

        // 워크스페이스 멤버인지 확인
        const isMember = await isWorkspaceMember(user.id, todo.workspaceId);
        if (!isMember) {
            return NextResponse.json(
                { error: "Forbidden: Not a member of this workspace" },
                { status: 403 }
            );
        }

        // 권한 확인: 생성자 또는 워크스페이스 admin/owner만 할당 가능
        const isCreator = await isTodoCreator(user.id, todoId);
        const isAdmin = await hasWorkspaceRole(user.id, todo.workspaceId, "admin");
        const isOwner = await hasWorkspaceRole(user.id, todo.workspaceId, "owner");

        if (!isCreator && !isAdmin && !isOwner) {
            return NextResponse.json(
                { error: "Forbidden: Only creator, admin, or owner can assign todo" },
                { status: 403 }
            );
        }

        // assignedTo가 null이거나 숫자여야 함
        if (assignedTo !== null && (typeof assignedTo !== "number" || assignedTo <= 0)) {
            return NextResponse.json(
                { error: "assignedTo must be a positive number or null" },
                { status: 400 }
            );
        }

        // 할당 대상이 워크스페이스 멤버인지 확인 (assignedTo가 null이 아닌 경우)
        if (assignedTo !== null) {
            const assigneeIsMember = await isWorkspaceMember(assignedTo, todo.workspaceId);
            if (!assigneeIsMember) {
                return NextResponse.json(
                    { error: "Assigned user must be a member of the workspace" },
                    { status: 400 }
                );
            }
        }

        await assignTodo(todoId, assignedTo);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Assign todo error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
