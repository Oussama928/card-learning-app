import { NextResponse } from "next/server";
import db from "../../../lib/db";
import { authenticateRequest } from "../authenticateRequest";

export async function POST(request) {
  try {
    const userId = await authenticateRequest(request);
    const { type, content } = await request.json();
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
    const notifData = {
      type,
      content,
    };
    const insertNotifQuery = `
    INSERT INTO notifications (user_id, type, content, is_read, created_at)
    SELECT id, $1, $2, $3, $4
    FROM users;
  `;

    const notifResult = await db.queryAsync(
      insertNotifQuery,
      [type, content, FALSE, new Date()]
    );
    return NextResponse.json({
      message: "Notif added successfully",
    });
  } catch (error) {
    console.error("Error in POST request:", error);
    return NextResponse.json(
      { message: "Error adding notif", error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const userId = await authenticateRequest(request);
    const { notifs } = await request.json();
    const updateNotifQuery = `
    UPDATE notifications
    SET is_read = TRUE
    WHERE id = $1;
  `;
    for (let i = 0; i < notifs.length; i++) {
      const notifResult = await db.queryAsync(updateNotifQuery, [notifs[i].id]);
    }
    return NextResponse.json(
      { message: "sucessfully set the notifs to read" }
    );
  } catch (error) {
    console.error("Error in POST request:", error);
    return NextResponse.json(
      { message: "Error adding notif", error: error.message },
      { status: 500 }
    );
  }
}
