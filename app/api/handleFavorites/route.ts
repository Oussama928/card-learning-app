import { NextRequest, NextResponse } from "next/server";
import db from "../../../lib/db";
import { authenticateRequest } from "../authenticateRequest";
import type { HandleFavoritesRequest, HandleFavoritesResponse } from "@/types";

export async function POST(
  request: NextRequest
): Promise<NextResponse<HandleFavoritesResponse>> {
  try {
    const { card_id, intent }: HandleFavoritesRequest = await request.json();
    const userId = await authenticateRequest(request);

    if (intent === "add") {
      const addfavoritesQuery =
        "INSERT INTO favorites (user_id,card_id) VALUES ($1,$2) RETURNING id";
      const result = await db.queryAsync(addfavoritesQuery, [userId, card_id]);
      const favId = result.rows[0].id;

      return NextResponse.json({
        success: true,
        message: `Card added successfully to favorites with id: ${favId}`,
        favId,
      });
    } else if (intent === "remove") {
      const removefavoritesQuery =
        "DELETE FROM favorites WHERE user_id = $1 AND card_id = $2";
      await db.queryAsync(removefavoritesQuery, [userId, card_id]);

      return NextResponse.json({
        success: true,
        message: "Card removed successfully from favorites",
      });
    }

    return NextResponse.json(
      { success: false, message: "Invalid intent" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error in POST request:", error);
    return NextResponse.json(
      { success: false, message: "Error adding card", error: error.message },
      { status: 500 }
    );
  }
}
