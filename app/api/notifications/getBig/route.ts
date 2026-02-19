import db from "../../../../lib/db";
import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "../../authenticateRequest";
import type { ApiErrorResponseDTO, GetNotificationsResponseDTO, NotificationItemDTO } from "@/types";
import { rateLimitOrThrow } from "@/lib/rateLimit";
import { handleApiError } from "@/lib/apiHandler";

export async function GET(
  request: NextRequest
): Promise<NextResponse<GetNotificationsResponseDTO | ApiErrorResponseDTO>> {
  try {
    const userId = await authenticateRequest(request);
    await rateLimitOrThrow({
      request,
      keyPrefix: "rl:notifications:getBig",
      points: 60,
      duration: 60,
      userId,
    });

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "25", 10);
    const offset = (page - 1) * limit;

    const countResult = await db.queryAsync(
      "SELECT COUNT(*) as total FROM notifications WHERE user_id = $1",
      [userId]
    );
    const total = parseInt(countResult.rows[0]?.total || "0", 10);

    const notifsResult = await db.queryAsync(
      `SELECT id, type, content, is_read, created_at, metadata 
       FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    const notifs: NotificationItemDTO[] = notifsResult.rows;

    await db.queryAsync(
      "UPDATE notifications SET is_read = TRUE WHERE user_id = $1",
      [userId]
    );

    return NextResponse.json({
      notifs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    if ((error as { status?: number }).status === 401) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    return handleApiError(error, request);
  }
}
