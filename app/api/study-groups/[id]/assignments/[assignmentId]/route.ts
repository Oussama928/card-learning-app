import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { AuthRequestError, authenticateRequest } from "@/app/api/authenticateRequest";
import { requireGroupTeacher } from "@/lib/studyGroups";
import type { DeleteStudyGroupAssignmentResponseDTO } from "@/types";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
) {
  try {
    const userId = await authenticateRequest(request);
    const { id, assignmentId } = await params;
    const groupId = Number(id);
    const parsedAssignmentId = Number(assignmentId);

    if (!groupId || !parsedAssignmentId) {
      return NextResponse.json({ error: "Invalid group or assignment id" }, { status: 400 });
    }

    await requireGroupTeacher(groupId, userId);

    const assignmentResult = await db.queryAsync(
      `SELECT id, group_id FROM study_group_assignments WHERE id = $1`,
      [parsedAssignmentId]
    );

    const assignment = assignmentResult.rows[0] as { id: number; group_id: number } | undefined;

    if (!assignment || Number(assignment.group_id) !== groupId) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    await db.queryAsync(`DELETE FROM study_group_assignments WHERE id = $1`, [parsedAssignmentId]);

    const response: DeleteStudyGroupAssignmentResponseDTO = { message: "Assignment deleted" };
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof AuthRequestError) {
      return NextResponse.json(error.json, { status: error.status });
    }

    if (error instanceof Error && error.message === "FORBIDDEN_GROUP_TEACHER") {
      return NextResponse.json({ error: "Teacher permission required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Failed to delete assignment" }, { status: 500 });
  }
}
