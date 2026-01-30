export interface Todo {
    id: number;
    title: string;
    description?: string;
    status: "todo" | "doing" | "done";
    assignedTo?: number; // 담당자 user id
    workspaceId: number;
    channelId?: number; // 채널에 연결된 todo인 경우
    createdBy: number;
    createdAt: Date;
    updatedAt: Date;
}