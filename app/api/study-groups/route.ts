import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { AuthRequestError, authenticateRequest } from "@/app/api/authenticateRequest";
import { generateJoinCode, normalizeVisibility } from "@/lib/studyGroups";
import type { CreateStudyGroupRequestDTO, StudyGroupDTO } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const userId = await authenticateRequest(request);

    const result = await db.queryAsync(
      `
      SELECT
        g.id,
        g.name,
        g.description,
        g.teacher_user_id,
        g.visibility,
        g.join_code,
        g.created_at,
        u.username AS teacher_name,
        CASE WHEN g.teacher_user_id = $1 THEN 'teacher' ELSE 'student' END AS role
      FROM study_groups g
      INNER JOIN users u ON u.id = g.teacher_user_id
      LEFT JOIN study_group_members gm
        ON gm.group_id = g.id
        AND gm.user_id = $1
      WHERE g.teacher_user_id = $1 OR gm.user_id = $1
      ORDER BY g.created_at DESC
      `,
      [userId]
    );

    const groups: StudyGroupDTO[] = result.rows.map((row: Record<string, unknown>) => ({
      id: Number(row.id),
      name: String(row.name || ""),
      description: row.description ? String(row.description) : null,
      teacherId: Number(row.teacher_user_id),
      teacherName: String(row.teacher_name || ""),
      visibility: row.visibility === "public" ? "public" : "private",
      joinCode: row.role === "teacher" ? (row.join_code ? String(row.join_code) : null) : null,
      role: row.role === "teacher" ? "teacher" : "student",
      createdAt: String(row.created_at || ""),
    }));

    return NextResponse.json({ message: "Study groups loaded", groups });
  } catch (error) {
    if (error instanceof AuthRequestError) {
      return NextResponse.json(error.json, { status: error.status });
    }
    console.error("Error loading study groups:", error);
    const detail = (error && (error as any).message) || String(error);
    return NextResponse.json({ error: "Failed to load study groups", detail }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await authenticateRequest(request);
    const body = (await request.json()) as Partial<CreateStudyGroupRequestDTO>;

    const name = String(body.name || "").trim();
    const description = String(body.description || "").trim();
    const visibility = normalizeVisibility(body.visibility);

    if (!name) {
      return NextResponse.json({ error: "Group name is required" }, { status: 400 });
    }

    let joinCode: string | null = null;

    if (visibility === "private") {
      for (let i = 0; i < 8; i++) {
        const candidate = generateJoinCode(8);
        const exists = await db.queryAsync(
          `SELECT id FROM study_groups WHERE join_code = $1`,
          [candidate]
        );
        if (exists.rows.length === 0) {
          joinCode = candidate;
          break;
        }
      }

      if (!joinCode) {
        return NextResponse.json({ error: "Failed to generate join code" }, { status: 500 });
      }
    }

    const insert = await db.queryAsync(
      `
      INSERT INTO study_groups (name, description, teacher_user_id, visibility, join_code)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, description, teacher_user_id, visibility, join_code, created_at
      `,
      [name, description || null, userId, visibility, joinCode]
    );

    const row = insert.rows[0] as Record<string, unknown>;

    return NextResponse.json(
      {
        message: "Study group created",
        group: {
          id: Number(row.id),
          name: String(row.name || ""),
          description: row.description ? String(row.description) : null,
          teacherId: Number(row.teacher_user_id),
          visibility: row.visibility === "public" ? "public" : "private",
          joinCode: row.join_code ? String(row.join_code) : null,
          role: "teacher",
          createdAt: String(row.created_at || ""),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AuthRequestError) {
      return NextResponse.json(error.json, { status: error.status });
    }

    return NextResponse.json({ error: "Failed to create study group" }, { status: 500 });
  }
}
