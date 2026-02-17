import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { AuthRequestError, authenticateRequest } from "@/app/api/authenticateRequest";
import type { JoinStudyGroupRequestDTO } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const userId = await authenticateRequest(request);
    const body = (await request.json()) as JoinStudyGroupRequestDTO;

    let groupId = Number(body.groupId || 0);
    const joinCode = String(body.joinCode || "").trim();

    let groupRow: Record<string, unknown> | undefined;

    if (groupId > 0) {
      const result = await db.queryAsync(
        `SELECT id, teacher_user_id, visibility, join_code FROM study_groups WHERE id = $1`,
        [groupId]
      );
      groupRow = result.rows[0] as Record<string, unknown> | undefined;
    } else if (joinCode) {
      const result = await db.queryAsync(
        `SELECT id, teacher_user_id, visibility, join_code FROM study_groups WHERE join_code = $1`,
        [joinCode]
      );
      groupRow = result.rows[0] as Record<string, unknown> | undefined;
      groupId = Number(groupRow?.id || 0);
    }

    if (!groupRow || !groupId) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    if (Number(groupRow.teacher_user_id) === userId) {
      return NextResponse.json({ message: "Teacher already in group", role: "teacher" });
    }

    const visibility = groupRow.visibility === "public" ? "public" : "private";

    if (visibility === "private" && (!joinCode || String(groupRow.join_code || "") !== joinCode)) {
      return NextResponse.json({ error: "Invalid join code" }, { status: 403 });
    }

    await db.queryAsync(
      `
      INSERT INTO study_group_members (group_id, user_id)
      VALUES ($1, $2)
      ON CONFLICT (group_id, user_id) DO NOTHING
      `,
      [groupId, userId]
    );

    return NextResponse.json({ message: "Joined group successfully", role: "student", groupId });
  } catch (error) {
    if (error instanceof AuthRequestError) {
      return NextResponse.json(error.json, { status: error.status });
    }

    return NextResponse.json({ error: "Failed to join group" }, { status: 500 });
  }
}
