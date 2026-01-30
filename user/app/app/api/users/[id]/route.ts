import { NextRequest, NextResponse } from "next/server";
import { updateName, deleteUser } from "@/services/user.service";

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { name } = await req.json();
        await updateName(req, Number(params.id), name);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }
        if (error.message.includes("Forbidden")) {
            return NextResponse.json(
                { error: error.message },
                { status: 403 }
            );
        }
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await deleteUser(req, Number(params.id));
        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }
        if (error.message.includes("Forbidden")) {
            return NextResponse.json(
                { error: error.message },
                { status: 403 }
            );
        }
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
