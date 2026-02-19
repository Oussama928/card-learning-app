import db from "../../../../lib/db";
import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "../../authenticateRequest";
import { rateLimitOrThrow } from "@/lib/rateLimit";
import { handleApiError } from "@/lib/apiHandler";

interface NotificationWithReadStatus {
  id: string;
  type: string;
  content: string;
  is_read: boolean | number;
  created_at: string;
  metadata?: Record<string, unknown> | null;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const userId = await authenticateRequest(request);
    await rateLimitOrThrow({
      request,
      keyPrefix: "rl:notifications:getSmall",
      points: 120,
      duration: 60,
      userId,
    });

    const notifsResult = await db.queryAsync(
      "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 4",
      [userId]
    );
    const notifs: NotificationWithReadStatus[] = notifsResult.rows.length
      ? notifsResult.rows
      : [];
    let isThereNew = false;

    for (let i = 0; i < notifs.length; i++) {
      if (notifs[i].is_read == 0) {
        isThereNew = true;
        break;
      }
    }

    return NextResponse.json({ notifs, new: isThereNew });
  } catch (error: any) {
    return handleApiError(error, request);
  }
}
