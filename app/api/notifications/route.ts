import { NextRequest, NextResponse } from "next/server";
import db from "../../../lib/db";
import { authenticateRequest } from "../authenticateRequest";
import type { NotificationItemDTO } from "@/types";
import { emitNotificationToAll } from "@/lib/socketServer";
import { rateLimitOrThrow } from "@/lib/rateLimit";
import { handleApiError, parseRequestBody } from "@/lib/apiHandler";
import { createNotificationSchema } from "@/lib/validation/schemas";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const userId = await authenticateRequest(request);
    await rateLimitOrThrow({
      request,
      keyPrefix: "rl:notifications:send",
      points: 10,
      duration: 60,
      userId,
    });
    const { type, content } = await parseRequestBody(
      request,
      createNotificationSchema
    );

    const checkUserResult = await db.queryAsync(
      `SELECT role FROM users WHERE id = $1`,
      [userId]
    );
    const userResult = checkUserResult.rows;

    if (userResult[0].role !== "admin") {
      return NextResponse.json(
        { message: "You are not authorized to add a notif" },
        { status: 401 }
      );
    }

    const insertNotifQuery = `
      INSERT INTO notifications (user_id, type, content, is_read, created_at, metadata)
      SELECT id, $1, $2, $3, $4, NULL
      FROM users;
    `;

    await db.queryAsync(insertNotifQuery, [type, content, false, new Date()]);

    emitNotificationToAll({
      type,
      content,
      created_at: new Date().toISOString(),
    });


    return NextResponse.json({
      message: "Notif added successfully",
    });
  } catch (error: any) {
    return handleApiError(error, request);
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const userId = await authenticateRequest(request);
    await rateLimitOrThrow({
      request,
      keyPrefix: "rl:notifications:update",
      points: 60,
      duration: 60,
      userId,
    });
    const { notifs }: { notifs: NotificationItemDTO[] } = await request.json();

    const updateNotifQuery = `
      UPDATE notifications
      SET is_read = TRUE
      WHERE id = $1;
    `;

    for (let i = 0; i < notifs.length; i++) {
      await db.queryAsync(updateNotifQuery, [notifs[i].id]);
    }

    return NextResponse.json({
      message: "sucessfully set the notifs to read",
    });
  } catch (error: any) {
    return handleApiError(error, request);
  }
}
