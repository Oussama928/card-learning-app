import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { authenticateRequest } from "@/app/api/authenticateRequest";
import type { PushSubscriptionPayload } from "@/lib/pushNotifications";
import { rateLimitOrThrow } from "@/lib/rateLimit";
import { handleApiError } from "@/lib/apiHandler";

export async function POST(request: NextRequest) {
  try {
    const userId = await authenticateRequest(request);
    await rateLimitOrThrow({
      request,
      keyPrefix: "rl:push:subscribe",
      points: 10,
      duration: 60,
      userId,
    });
    const subscription = (await request.json()) as PushSubscriptionPayload;

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json({ error: "Invalid push subscription" }, { status: 400 });
    }

    await db.queryAsync(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (endpoint)
       DO UPDATE SET user_id = EXCLUDED.user_id, p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth, updated_at = NOW()`,
      [userId, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return handleApiError(error, request);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await authenticateRequest(request);
    await rateLimitOrThrow({
      request,
      keyPrefix: "rl:push:unsubscribe",
      points: 10,
      duration: 60,
      userId,
    });
    const { endpoint } = (await request.json()) as { endpoint: string };

    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint required" }, { status: 400 });
    }

    await db.queryAsync(
      "DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2",
      [userId, endpoint]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return handleApiError(error, request);
  }
}
