import { getDB } from "@/lib/db";
import type { Todo } from "@/domain/todo";
const db = getDB();
/**
 * Todo 생성
 */
export async function createTodo(

    title: string,
    workspaceId: number,
    createdBy: number,
    description?: string,
    channelId?: number,
    assignedTo?: number
): Promise<number> {
    const [result] = await db.query(
        `INSERT INTO todos (title, description, status, workspaceId, channelId, createdBy, assignedTo, createdAt, updatedAt) 
         VALUES (?, ?, 'todo', ?, ?, ?, ?, NOW(), NOW())`,
        [title, description || null, workspaceId, channelId || null, createdBy, assignedTo || null]
    ) as any;

    return result.insertId;
}

/**
 * Todo 조회
 */
export async function getTodo(todoId: number): Promise<Todo | null> {
    const [rows] = await db.query(
        `SELECT id, title, description, status, workspaceId, channelId, createdBy, assignedTo, createdAt, updatedAt 
         FROM todos 
         WHERE id = ?`,
        [todoId]
    ) as any[];

    if (!rows || rows.length === 0) {
        return null;
    }

    const row = rows[0];
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        status: row.status,
        workspaceId: row.workspaceId,
        channelId: row.channelId,
        createdBy: row.createdBy,
        assignedTo: row.assignedTo,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
}

/**
 * Workspace의 모든 Todo 조회
 */
export async function getWorkspaceTodos(workspaceId: number): Promise<Todo[]> {
    const [rows] = await db.query(
        `SELECT id, title, description, status, workspaceId, channelId, createdBy, assignedTo, createdAt, updatedAt 
         FROM todos 
         WHERE workspaceId = ? 
         ORDER BY createdAt DESC`,
        [workspaceId]
    ) as any[];

    return rows.map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        status: row.status,
        workspaceId: row.workspaceId,
        channelId: row.channelId,
        createdBy: row.createdBy,
        assignedTo: row.assignedTo,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    }));
}

/**
 * 사용자에게 할당된 Todo 조회
 */
export async function getAssignedTodos(userId: number): Promise<Todo[]> {
    const [rows] = await db.query(
        `SELECT id, title, description, status, workspaceId, channelId, createdBy, assignedTo, createdAt, updatedAt 
         FROM todos 
         WHERE assignedTo = ? 
         ORDER BY createdAt DESC`,
        [userId]
    ) as any[];

    return rows.map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        status: row.status,
        workspaceId: row.workspaceId,
        channelId: row.channelId,
        createdBy: row.createdBy,
        assignedTo: row.assignedTo,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    }));
}

/**
 * Todo 담당자 할당/변경
 */
export async function assignTodo(
    todoId: number,
    assignedTo: number | null
): Promise<void> {
    await db.query(
        `UPDATE todos 
         SET assignedTo = ?, updatedAt = NOW() 
         WHERE id = ?`,
        [assignedTo, todoId]
    );
}

/**
 * Todo 상태 변경
 */
export async function updateTodoStatus(
    todoId: number,
    status: "todo" | "doing" | "done"
): Promise<void> {
    await db.query(
        `UPDATE todos 
         SET status = ?, updatedAt = NOW() 
         WHERE id = ?`,
        [status, todoId]
    );
}

/**
 * Todo 업데이트
 */
export async function updateTodo(
    todoId: number,
    updates: {
        title?: string;
        description?: string;
        status?: "todo" | "doing" | "done";
        assignedTo?: number | null;
    }
): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.title !== undefined) {
        fields.push("title = ?");
        values.push(updates.title);
    }
    if (updates.description !== undefined) {
        fields.push("description = ?");
        values.push(updates.description);
    }
    if (updates.status !== undefined) {
        fields.push("status = ?");
        values.push(updates.status);
    }
    if (updates.assignedTo !== undefined) {
        fields.push("assignedTo = ?");
        values.push(updates.assignedTo);
    }

    if (fields.length === 0) {
        return;
    }

    fields.push("updatedAt = NOW()");
    values.push(todoId);

    await db.query(
        `UPDATE todos SET ${fields.join(", ")} WHERE id = ?`,
        values
    );
}

/**
 * Todo 삭제
 */
export async function deleteTodo(todoId: number): Promise<void> {
    await db.query(`DELETE FROM todos WHERE id = ?`, [todoId]);
}
