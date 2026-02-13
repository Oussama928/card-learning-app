import { NextRequest, NextResponse } from "next/server";
import db from "../../../lib/db";
import { authenticateRequest } from "../authenticateRequest";
import type { ApiErrorResponseDTO, GetGlobalStatsResponseDTO } from "@/types";
import { cache, cacheKeys } from "@/lib/cache";
import { rateLimitOrThrow } from "@/lib/rateLimit";
import { handleApiError } from "@/lib/apiHandler";

export async function GET(
  request: NextRequest
): Promise<NextResponse<GetGlobalStatsResponseDTO | ApiErrorResponseDTO>> {
  try {
    const userId = await authenticateRequest(request);
    await rateLimitOrThrow({
      request,
      keyPrefix: "rl:global-stats",
      points: 30,
      duration: 60,
      userId,
    });

    const cached = await cache.getJSON<GetGlobalStatsResponseDTO>(cacheKeys.globalStats);
    if (cached) {
      return NextResponse.json(cached);
    }

    const topXpQuery = `
      SELECT users.username, users.id, user_stats.xp, users.image
      FROM users
      LEFT JOIN user_stats ON users.id = user_stats.user_id
      ORDER BY xp DESC
      LIMIT 10
    `;
    const topXpResult = await db.queryAsync(topXpQuery);
    const result = topXpResult.rows;

    const response: GetGlobalStatsResponseDTO = {
      message: "Global stats retrieved successfully",
      topXpResult: result,
    };

    await cache.setJSON(cacheKeys.globalStats, response, 60);

    return NextResponse.json(response);
  } catch (error: any) {
    return handleApiError(error, request);
  }
}
