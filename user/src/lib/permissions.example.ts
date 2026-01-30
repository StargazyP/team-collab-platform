/**
 * Service 레벨 권한 체크 사용 예제
 * 
 * 이 파일은 예제용이며 실제로는 사용되지 않습니다.
 * 참고용으로만 사용하세요.
 */

import { NextRequest } from "next/server";
import { 
    checkPermission, 
    isWorkspaceMember, 
    hasWorkspaceRole,
    isTodoAssignee,
    isTodoCreator 
} from "@/lib/permissions";
import { updateName } from "@/services/user.service";
import { assignTodo } from "@/services/todo.service";

// 예제 1: Service 레벨에서 권한 체크
export async function exampleCheckPermission(req: NextRequest) {
    const hasPermission = await checkPermission(req, "USER_UPDATE");
    if (!hasPermission) {
        throw new Error("Forbidden: USER_UPDATE permission required");
    }
    // 권한이 있을 때만 실행되는 코드
}

// 예제 2: Workspace 멤버 확인
export async function exampleWorkspaceMember(userId: number, workspaceId: number) {
    const isMember = await isWorkspaceMember(userId, workspaceId);
    if (!isMember) {
        throw new Error("User is not a member of this workspace");
    }
    // 멤버일 때만 실행되는 코드
}

// 예제 3: Workspace 역할 확인
export async function exampleWorkspaceRole(userId: number, workspaceId: number) {
    const isAdmin = await hasWorkspaceRole(userId, workspaceId, "admin");
    if (!isAdmin) {
        throw new Error("User is not an admin of this workspace");
    }
    // Admin일 때만 실행되는 코드
}

// 예제 4: Todo 담당자 확인
export async function exampleTodoAssignee(userId: number, todoId: number) {
    const isAssignee = await isTodoAssignee(userId, todoId);
    if (!isAssignee) {
        throw new Error("User is not assigned to this todo");
    }
    // 담당자일 때만 실행되는 코드
}

// 예제 5: Todo 생성자 또는 담당자 확인
export async function exampleTodoAccess(userId: number, todoId: number) {
    const isCreator = await isTodoCreator(userId, todoId);
    const isAssignee = await isTodoAssignee(userId, todoId);
    
    if (!isCreator && !isAssignee) {
        throw new Error("User does not have access to this todo");
    }
    // 생성자이거나 담당자일 때만 실행되는 코드
}

// 예제 6: API 라우트에서 사용
export async function exampleApiRoute(req: NextRequest) {
    // 권한 체크
    const hasPermission = await checkPermission(req, "USER_UPDATE");
    if (!hasPermission) {
        return { error: "Forbidden", status: 403 };
    }
    
    // 권한이 있으면 서비스 함수 호출
    // await updateName(req, userId, newName);
}
