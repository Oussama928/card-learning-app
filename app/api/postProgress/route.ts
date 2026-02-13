import { NextRequest, NextResponse } from "next/server";
import db from "../../../lib/db";
import { authenticateRequest } from "../authenticateRequest";
import type { UpdateProgressRequest } from "@/types";
import { cache, cacheKeys } from "@/lib/cache";
import { handleApiError } from "@/lib/apiHandler";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { word_id, is_learned }: UpdateProgressRequest =
      await request.json();
    const userId = await authenticateRequest(request);

    await db.queryAsync(
      `
      INSERT INTO user_progress 
        (user_id, word_id, is_learned)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, word_id) DO UPDATE
        SET is_learned = EXCLUDED.is_learned
    `,
      [userId, word_id, is_learned]
    );

    await cache.del(cacheKeys.userStats(userId));
    await cache.del(cacheKeys.globalStats);

    return NextResponse.json({
      success: true,
      message: `Word marked as ${is_learned ? "learned" : "unlearned"}`,
    });
  } catch (error: any) {
    return handleApiError(error, request);
  }
}
