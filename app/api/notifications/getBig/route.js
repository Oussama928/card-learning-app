import db from "../../../../lib/db";
import { NextResponse } from "next/server";
import { authenticateRequest } from "../../authenticateRequest";
//later specify how much per call
export async function GET(request) {
  try {
    const userId = await authenticateRequest(request);
    
    const notifsResult = await db.queryAsync(
      "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC ",
      [userId]
    );
    const notifs = notifsResult.rows.length ? notifsResult.rows : [];
    //update is_read
    const updateNotifQuery = `
    UPDATE notifications
    SET is_read = 1
    WHERE user_id = $1;
  `;
    const notifResult = await db.queryAsync(
      updateNotifQuery,
      [userId]
    );

    return NextResponse.json({ notifs });

  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to get notifs" },
      { status: 500 }
    );
  }
}
