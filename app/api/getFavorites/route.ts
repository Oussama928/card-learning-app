import db from "../../../lib/db";
import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "../authenticateRequest";
import type { ApiErrorResponseDTO, CardWithOwnerDTO, FavoritesResponseDTO, OwnerSummaryDTO } from "@/types";

export async function GET(
  request: NextRequest
): Promise<NextResponse<FavoritesResponseDTO | ApiErrorResponseDTO>> {
  try {
    const userId = await authenticateRequest(request);

    const favoritesResult = await db.queryAsync(
      "SELECT card_id FROM favorites WHERE user_id = $1",
      [userId]
    );
    const favorites = favoritesResult.rows;
    console.log(favorites);

    if (!favorites || favorites.length === 0) {
      return NextResponse.json({
        message: "No favorites found",
        favorites: [],
        fullFavorites: [],
      });
    }

    const array: string[] = [];
    const cards: CardWithOwnerDTO[] = [];

    for (let i = 0; i < favorites.length; i++) {
      array.push(favorites[i].card_id);
      const cardResult = await db.queryAsync(
        "SELECT * FROM cards WHERE id = $1",
        [favorites[i].card_id]
      );
      cards.push(cardResult.rows[0]);
    }

    const userIds = cards.map((card) => card.user_id);
    const placeholders = userIds.map((_, i) => `$${i + 1}`).join(",");
    const getOwnersQuery = `
      SELECT * FROM users WHERE id IN (${placeholders})
    `;
    const ownersResult = await db.queryAsync(getOwnersQuery, userIds);
    const owners: OwnerSummaryDTO[] = ownersResult.rows;

    const ownersMap = owners.reduce((map: Record<string, OwnerSummaryDTO>, owner: OwnerSummaryDTO) => {
      map[owner.id] = owner;
      return map;
    }, {});

    for (const card of cards) {
      if (card.user_id && ownersMap[card.user_id]) {
        card.owner = ownersMap[card.user_id];
      }
    }

    return NextResponse.json({
      message: "favorites retrieved successfully",
      favorites: array,
      fullFavorites: cards,
    });
  } catch (error: unknown) {
    console.error("Database error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch card data" },
      { status: 500 }
    );
  }
}
