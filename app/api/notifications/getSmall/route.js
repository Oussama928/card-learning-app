import db from "../../../../lib/db";
import { NextResponse } from "next/server";
import { authenticateRequest } from "../../authenticateRequest";

export async function GET(request) {
  try {
    const userId = await authenticateRequest(request);
    
    const notifsResult = await db.queryAsync(
      "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 4",
      [userId]
    );
    const notifs = notifsResult.rows.length ? notifsResult.rows : [];
    let isThereNew = false;
    for(let i = 0; i < notifs.length; i++){
      if(notifs[i].is_read == 0){
        isThereNew = true;
        break;
      }
    }

    return NextResponse.json({ notifs,new: isThereNew });

  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to get notifs" },
      { status: 500 }
    );
  }
}
