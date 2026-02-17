import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { AuthRequestError, authenticateRequest } from "@/app/api/authenticateRequest";
import { requireGroupMember, requireGroupTeacher } from "@/lib/studyGroups";
import type {
  CreateStudyGroupAssignmentRequestDTO,
  StudyGroupAssignmentDTO,
} from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await authenticateRequest(request);
    const { id } = await params;
    const groupId = Number(id);

    if (!groupId) {
      return NextResponse.json({ error: "Invalid group id" }, { status: 400 });
    }

    await requireGroupMember(groupId, userId);

    const result = await db.queryAsync(
      `
      SELECT
        a.id,
        a.group_id,
        a.assignment_type,
        a.card_id,
        a.class_id,
        a.title,
        a.due_at,
        a.assigned_by_user_id,
        a.created_at,
        u.username AS assigned_by_name
      FROM study_group_assignments a
      INNER JOIN users u ON u.id = a.assigned_by_user_id
      WHERE a.group_id = $1
      ORDER BY a.created_at DESC
      LIMIT 50
      `,
      [groupId]
    );

    const assignments: StudyGroupAssignmentDTO[] = result.rows.map((row: Record<string, unknown>) => ({
      id: Number(row.id),
      groupId: Number(row.group_id),
      assignmentType: row.assignment_type === "class" ? "class" : "card",
      cardId: row.card_id ? Number(row.card_id) : null,
      classId: row.class_id ? Number(row.class_id) : null,
      title: row.title ? String(row.title) : null,
      dueAt: row.due_at ? String(row.due_at) : null,
      assignedBy: Number(row.assigned_by_user_id),
      assignedByName: String(row.assigned_by_name || ""),
      createdAt: String(row.created_at || ""),
    }));

    return NextResponse.json({ message: "Assignments loaded", assignments });
  } catch (error) {
    if (error instanceof AuthRequestError) {
      return NextResponse.json(error.json, { status: error.status });
    }

    if (error instanceof Error && error.message === "FORBIDDEN_GROUP_MEMBER") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ error: "Failed to load assignments" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await authenticateRequest(request);
    const { id } = await params;
    const groupId = Number(id);

    if (!groupId) {
      return NextResponse.json({ error: "Invalid group id" }, { status: 400 });
    }

    await requireGroupTeacher(groupId, userId);

    const body = (await request.json()) as Partial<CreateStudyGroupAssignmentRequestDTO>;

    const assignmentType = body.assignmentType === "class" ? "class" : "card";
    const cardId = body.cardId ? Number(body.cardId) : null;
    const classId = body.classId ? Number(body.classId) : null;
    const title = String(body.title || "").trim() || null;
    const dueAt = body.dueAt ? new Date(body.dueAt) : null;

    if (assignmentType === "card" && !cardId) {
      return NextResponse.json({ error: "cardId is required for card assignments" }, { status: 400 });
    }

    if (assignmentType === "class" && !classId) {
      return NextResponse.json({ error: "classId is required for class assignments" }, { status: 400 });
    }

    const insert = await db.queryAsync(
      `
      INSERT INTO study_group_assignments
        (group_id, assigned_by_user_id, assignment_type, card_id, class_id, title, due_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, group_id, assignment_type, card_id, class_id, title, due_at, assigned_by_user_id, created_at
      `,
      [
        groupId,
        userId,
        assignmentType,
        assignmentType === "card" ? cardId : null,
        assignmentType === "class" ? classId : null,
        title,
        dueAt,
      ]
    );

    const row = insert.rows[0] as Record<string, unknown>;

    return NextResponse.json(
      {
        message: "Assignment created",
        assignment: {
          id: Number(row.id),
          groupId: Number(row.group_id),
          assignmentType: row.assignment_type === "class" ? "class" : "card",
          cardId: row.card_id ? Number(row.card_id) : null,
          classId: row.class_id ? Number(row.class_id) : null,
          title: row.title ? String(row.title) : null,
          dueAt: row.due_at ? String(row.due_at) : null,
          assignedBy: Number(row.assigned_by_user_id),
          createdAt: String(row.created_at || ""),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AuthRequestError) {
      return NextResponse.json(error.json, { status: error.status });
    }

    if (error instanceof Error && error.message === "FORBIDDEN_GROUP_TEACHER") {
      return NextResponse.json({ error: "Teacher permission required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Failed to create assignment" }, { status: 500 });
  }
}
