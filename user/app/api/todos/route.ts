import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
    getWorkspaceTodos,
    getAssignedTodos,
    createTodo,
} from "@/services/todo.service";
import { isWorkspaceMember } from "@/lib/permissions";

/**
 * GET /api/todos
 * Query params:
 *  - workspaceId
 *  - assignedTo (me | userId)
 */
export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser(req);
        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(req.url);
        const workspaceIdParam = searchParams.get("workspaceId");
        const assignedTo = searchParams.get("assignedTo");

        let todos;

        if (workspaceIdParam) {
            const workspaceId = Number(workspaceIdParam);
            if (Number.isNaN(workspaceId)) {
                return NextResponse.json(
                    { error: "Invalid workspaceId" },
                    { status: 400 }
                );
            }

            // 워크스페이스 멤버 확인
            const isMember = await isWorkspaceMember(user.id, workspaceId);
            if (!isMember) {
                return NextResponse.json(
                    { error: "Forbidden: Not a member of this workspace" },
                    { status: 403 }
                );
            }

            todos = await getWorkspaceTodos(workspaceId);
        } else if (
            assignedTo === "me" ||
            assignedTo === user.id.toString()
        ) {
            // 내 Todo
            todos = await getAssignedTodos(user.id);
        } else {
            return NextResponse.json(
                {
                    error:
                        "Either workspaceId or assignedTo parameter is required",
                },
                { status: 400 }
            );
        }

        return NextResponse.json({ todos });
    } catch (error) {
        console.error("GET /api/todos error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/todos
 */
export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser(req);
        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const {
            title,
            workspaceId,
            description,
            channelId,
            assignedTo,
        } = await req.json();

        if (!title || !workspaceId) {
            return NextResponse.json(
                { error: "Title and workspaceId are required" },
                { status: 400 }
            );
        }

        const wsId = Number(workspaceId);
        if (Number.isNaN(wsId)) {
            return NextResponse.json(
                { error: "Invalid workspaceId" },
                { status: 400 }
            );
        }

        // 워크스페이스 멤버 확인
        const isMember = await isWorkspaceMember(user.id, wsId);
        if (!isMember) {
            return NextResponse.json(
                { error: "Forbidden: Not a member of this workspace" },
                { status: 403 }
            );
        }

        const todoId = await createTodo(
            title,
            wsId,
            user.id,
            description,
            channelId,
            assignedTo
        );

        return NextResponse.json({
            success: true,
            todoId,
        });
    } catch (error) {
        console.error("POST /api/todos error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
