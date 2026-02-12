import { NextRequest, NextResponse } from "next/server";
import db from "../../../lib/db";
import { authenticateRequest } from "../authenticateRequest";
import type { CreateNotificationRequestDTO, NotificationItemDTO } from "@/types";
import { emitNotificationToAll } from "@/lib/socketServer";
import { sendPushNotification } from "@/lib/pushNotifications";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const userId = await authenticateRequest(request);
    const { type, content }: CreateNotificationRequestDTO = await request.json();

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
      INSERT INTO notifications (user_id, type, content, is_read, created_at)
      SELECT id, $1, $2, $3, $4
      FROM users;
    `;

    await db.queryAsync(insertNotifQuery, [type, content, false, new Date()]);

    emitNotificationToAll({
      type,
      content,
      created_at: new Date().toISOString(),
    });

    const subscriptionsResult = await db.queryAsync(
      "SELECT endpoint, p256dh, auth FROM push_subscriptions"
    );

    await Promise.allSettled(
      subscriptionsResult.rows.map((sub: any) =>
        sendPushNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          {
            title: "Card Learning",
            body: content,
            url: "/notifications",
          }
        )
      )
    );

    return NextResponse.json({
      message: "Notif added successfully",
    });
  } catch (error: any) {
    console.error("Error in POST request:", error);
    return NextResponse.json(
      { message: "Error adding notif", error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const userId = await authenticateRequest(request);
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
    console.error("Error in PATCH request:", error);
    return NextResponse.json(
      { message: "Error updating notifs", error: error.message },
      { status: 500 }
    );
  }
}
