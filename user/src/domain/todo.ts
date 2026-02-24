export interface Todo {
  id: number;
  title: string;
  description?: string;
  status: 'todo' | 'doing' | 'done';
  assignedTo?: number;
  workspaceId: number;
  channelId?: number;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}