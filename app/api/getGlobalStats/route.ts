import { NextRequest, NextResponse } from "next/server";
import db from "../../../lib/db";
import { authenticateRequest } from "../authenticateRequest";
import type { ApiErrorResponseDTO, GetGlobalStatsResponseDTO } from "@/types";

export async function GET(
  request: NextRequest
): Promise<NextResponse<GetGlobalStatsResponseDTO | ApiErrorResponseDTO>> {
  try {
    const userId = await authenticateRequest(request);

    const topXpQuery = `
      SELECT users.username, users.id, user_stats.xp, users.image
      FROM users
      LEFT JOIN user_stats ON users.id = user_stats.user_id
      ORDER BY xp DESC
      LIMIT 10
    `;
    const topXpResult = await db.queryAsync(topXpQuery);
    const result = topXpResult.rows;

    return NextResponse.json({
      message: "Global stats retrieved successfully",
      topXpResult: result,
    });
  } catch (error: any) {
    console.error("Error in GET request:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error getting global stats",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
