import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
    getWorkspaceTodos,
    getAssignedTodos,
    createTodo,
} from "@/services/todo.service";
import { isWorkspaceMember } from "@/lib/permissions";

/**
 * GET /api/todos - Todo 목록 (워크스페이스별/담당자별)
 * Query params: workspaceId, assignedTo (me 또는 userId)
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

        const { searchParams } = new URL(req.url);
        const workspaceId = searchParams.get("workspaceId");
        const assignedTo = searchParams.get("assignedTo");

        let todos;

        if (workspaceId) {
            // 워크스페이스별 Todo 조회
            const wsId = Number(workspaceId);

            // 워크스페이스 멤버인지 확인
            const isMember = await isWorkspaceMember(user.id, wsId);
            if (!isMember) {
                return NextResponse.json(
                    { error: "Forbidden: Not a member of this workspace" },
                    { status: 403 }
                );
            }

            todos = await getWorkspaceTodos(wsId);
        } else if (assignedTo === "me" || assignedTo === user.id.toString()) {
            // 담당자별 Todo 조회 (내 Todo)
            todos = await getAssignedTodos(user.id);
        } else {
            return NextResponse.json(
                { error: "Either workspaceId or assignedTo parameter is required" },
                { status: 400 }
            );
        }

        return NextResponse.json({ todos });
    } catch (error: any) {
        console.error("Get todos error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/todos - Todo 생성
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

        const { title, workspaceId, description, channelId, assignedTo } =
            await req.json();

        if (!title || !workspaceId) {
            return NextResponse.json(
                { error: "Title and workspaceId are required" },
                { status: 400 }
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

        const todoId = await createTodo(
            title,
            workspaceId,
            user.id,
            description,
            channelId,
            assignedTo
        );

        return NextResponse.json({
            success: true,
            todoId,
        });
    } catch (error: any) {
        console.error("Create todo error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
