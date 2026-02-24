import { getDB } from "@/lib/db";

export interface TodoRow {
  id: number;
  title: string;
  description: string | null;
  status: "todo" | "doing" | "done";
  workspaceId: number;
  channelId: number | null;
  createdBy: number;
  assignedTo: number | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export async function getTodo(id: number): Promise<TodoRow | null> {
  const db = getDB();
  const [rows] = await db.query(
    "SELECT * FROM todos WHERE id = ?",
    [id]
  );
  const arr = rows as TodoRow[];
  return arr?.[0] ?? null;
}

export async function updateTodo(id: number, updates: Partial<Pick<TodoRow, "title" | "description" | "status">>): Promise<void> {
  const db = getDB();
  const fields: string[] = [];
  const values: unknown[] = [];
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
  if (fields.length === 0) return;
  values.push(id);
  await db.query(
    `UPDATE todos SET ${fields.join(", ")} WHERE id = ?`,
    values
  );
}

export async function deleteTodo(id: number): Promise<void> {
  const db = getDB();
  await db.query("DELETE FROM todos WHERE id = ?", [id]);
}

export async function getWorkspaceTodos(workspaceId: number): Promise<(TodoRow & { createdByName?: string })[]> {
  const db = getDB();
  const [rows] = await db.query(
    `SELECT t.*, u.name as createdByName
     FROM todos t
     LEFT JOIN users u ON t.createdBy = u.id
     WHERE t.workspaceId = ?
     ORDER BY t.createdAt DESC`,
    [workspaceId]
  );
  return (rows as any[]) || [];
}

export async function createTodo(data: {
  title: string;
  description?: string;
  workspaceId: number;
  createdBy: number;
}): Promise<number> {
  const db = getDB();
  const [result] = await db.query(
    "INSERT INTO todos (title, description, workspaceId, createdBy) VALUES (?, ?, ?, ?)",
    [data.title, data.description || null, data.workspaceId, data.createdBy]
  );
  return (result as { insertId: number }).insertId;
}
