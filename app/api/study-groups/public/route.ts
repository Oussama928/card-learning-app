import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { AuthRequestError, authenticateRequest } from "@/app/api/authenticateRequest";
import type { GetPublicStudyGroupsResponseDTO, PublicStudyGroupDTO } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const userId = await authenticateRequest(request);
    const url = new URL(request.url);
    const query = String(url.searchParams.get("q") || "").trim();
    const requestedPage = parseInt(url.searchParams.get("page") || "1", 10);
    const requestedLimit = parseInt(url.searchParams.get("limit") || "12", 10);

    const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const limit = Math.min(Math.max(requestedLimit || 12, 1), 50);
    const offset = (page - 1) * limit;

    const countParams: Array<string | number> = [];
    let whereClause = "WHERE g.visibility = 'public'";

    if (query) {
      countParams.push(`%${query}%`);
      whereClause += ` AND (g.name ILIKE $${countParams.length} OR g.description ILIKE $${countParams.length})`;
    }

    const countResult = await db.queryAsync(
      `SELECT COUNT(*)::int AS total FROM study_groups g ${whereClause}`,
      countParams
    );

    const total = Number(countResult.rows[0]?.total || 0);

    const groupsParams: Array<string | number> = [userId];
    let groupWhereClause = "WHERE g.visibility = 'public'";

    if (query) {
      groupsParams.push(`%${query}%`);
      groupWhereClause += " AND (g.name ILIKE $2 OR g.description ILIKE $2)";
    }

    const groupsResult = await db.queryAsync(
      `
      SELECT
        g.id,
        g.name,
        g.description,
        g.teacher_user_id,
        g.visibility,
        g.created_at,
        u.username AS teacher_name,
        CASE
          WHEN g.teacher_user_id = $1 THEN 'teacher'
          WHEN gm.user_id IS NOT NULL THEN 'student'
          ELSE NULL
        END AS role
      FROM study_groups g
      INNER JOIN users u ON u.id = g.teacher_user_id
      LEFT JOIN study_group_members gm
        ON gm.group_id = g.id
        AND gm.user_id = $1
      ${groupWhereClause}
      ORDER BY g.created_at DESC
      LIMIT $${groupsParams.length + 1}
      OFFSET $${groupsParams.length + 2}
      `,
      [...groupsParams, limit, offset]
    );

    const groups: PublicStudyGroupDTO[] = groupsResult.rows.map((row: Record<string, unknown>) => ({
      id: Number(row.id),
      name: String(row.name || ""),
      description: row.description ? String(row.description) : null,
      teacherId: Number(row.teacher_user_id),
      teacherName: String(row.teacher_name || ""),
      visibility: "public",
      role: row.role === "teacher" ? "teacher" : row.role === "student" ? "student" : null,
      isMember: row.role === "teacher" || row.role === "student",
      createdAt: String(row.created_at || ""),
    }));

    const response: GetPublicStudyGroupsResponseDTO = {
      message: "Public groups loaded",
      groups,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof AuthRequestError) {
      return NextResponse.json(error.json, { status: error.status });
    }

    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Failed to load public groups", detail }, { status: 500 });
  }
}
