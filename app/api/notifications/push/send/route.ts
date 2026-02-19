import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { authenticateRequest } from "@/app/api/authenticateRequest";
import { sendPushNotification } from "@/lib/pushNotifications";
import { rateLimitOrThrow } from "@/lib/rateLimit";
import { handleApiError } from "@/lib/apiHandler";

export async function POST(request: NextRequest) {
  try {
    const userId = await authenticateRequest(request);
    await rateLimitOrThrow({
      request,
      keyPrefix: "rl:push:send",
      points: 10,
      duration: 60,
      userId,
    });

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

    const params: (number | string)[] = [];
    let where = "";
    if (body.userId) {
      params.push(body.userId);
      where = `WHERE user_id = $${params.length}`;
    }

    interface PushSubscriptionRow {
      endpoint: string;
      p256dh: string;
      auth: string;
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

    const subs = subsResult.rows as PushSubscriptionRow[];

    await Promise.allSettled(
      subs.map((sub) =>
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
  } catch (error: unknown) {
    return handleApiError(error, request);
  }
}
