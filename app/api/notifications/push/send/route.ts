import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { authenticateRequest } from "@/app/api/authenticateRequest";
import { sendPushNotification } from "@/lib/pushNotifications";

export async function POST(request: NextRequest) {
  try {
    const userId = await authenticateRequest(request);

    const userRes = await db.queryAsync("SELECT role FROM users WHERE id = $1", [userId]);
    if (userRes.rows[0]?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as {
      title: string;
      body: string;
      userId?: number;
      url?: string;
    };

    const params: any[] = [];
    let where = "";
    if (body.userId) {
      params.push(body.userId);
      where = `WHERE user_id = $${params.length}`;
    }

    const subsResult = await db.queryAsync(
      `SELECT endpoint, p256dh, auth FROM push_subscriptions ${where}`,
      params
    );

    const payload = {
      title: body.title || "Card Learning",
      body: body.body || "You have a new notification",
      url: body.url || "/notifications",
    };

    await Promise.allSettled(
      subsResult.rows.map((sub: any) =>
        sendPushNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        )
      )
    );

    return NextResponse.json({ success: true, sent: subsResult.rows.length });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to send push notifications", details: error.message },
      { status: error?.status || 500 }
    );
  }
}
