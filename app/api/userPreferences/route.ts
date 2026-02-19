import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { AuthRequestError, authenticateRequest } from "@/app/api/authenticateRequest";

export async function GET(request: NextRequest) {
  try {
    const userId = await authenticateRequest(request);

    const result = await db.queryAsync(
      `SELECT study_mode FROM user_preferences WHERE user_id = $1`,
      [userId]
    );

    const preference = result.rows[0];
    const studyMode = preference?.study_mode ?? "default";

    return NextResponse.json({ study_mode: studyMode });
  } catch (error) {
    if (error instanceof AuthRequestError) {
      return NextResponse.json(error.json, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await authenticateRequest(request);
    const body = (await request.json()) as { study_mode?: string };

    const studyMode = body.study_mode === "spaced_repetition" ? "spaced_repetition" : "default";

    await db.queryAsync(
      `
      INSERT INTO user_preferences (user_id, study_mode)
      VALUES ($1, $2)
      ON CONFLICT (user_id) DO UPDATE
        SET study_mode = EXCLUDED.study_mode, updated_at = NOW()
      `,
      [userId, studyMode]
    );

    return NextResponse.json({
      message: "Study mode preference updated",
      study_mode: studyMode,
    });
  } catch (error) {
    if (error instanceof AuthRequestError) {
      return NextResponse.json(error.json, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  }
}
