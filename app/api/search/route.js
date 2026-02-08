import { NextResponse } from "next/server";
import db from "../../../lib/db";
import { authenticateRequest } from "../authenticateRequest";

export async function GET(request) {
  try {
    const userId = await authenticateRequest(request);

    const { searchQuery, page } = Object.fromEntries(
      new URL(request.url).searchParams
    );
    console.log(searchQuery, page);

    const pageNumber = parseInt(page, 10);
    if (isNaN(pageNumber) || pageNumber < 0) {
      return NextResponse.json(
        { error: "Invalid page number" },
        { status: 400 }
      );
    }
    const offset = (pageNumber-1) * 10;

    const searchQueryQuery = `
      SELECT * FROM cards 
      WHERE title LIKE $1 OR description LIKE $2 
      LIMIT 10 OFFSET $3
    `;
    console.log(searchQuery);

    const cardsResult = await db.queryAsync(
      searchQueryQuery,
      [`%${searchQuery}%`, `%${searchQuery}%`, offset]
    );
    const cards = cardsResult.rows;

    if (!cards.length) {
      return NextResponse.json([]);
    }

    const userIds = cards.map((card) => card.user_id);

    if (!userIds.length) {
      return NextResponse.json(cards);
    }

    const placeholders = userIds.map((_, i) => `$${i + 1}`).join(',');
    const getOwnersQuery = `
      SELECT * FROM users WHERE id IN (${placeholders})
    `;

    const ownersResult = await db.queryAsync(getOwnersQuery, userIds);
    const owners = ownersResult.rows;

    const ownersMap = owners.reduce((map, owner) => {
      map[owner.id] = owner;
      return map;
    }, {});

    for (const card of cards) {
      card.owner = ownersMap[card.user_id];
    }

    return NextResponse.json(cards);
  } catch (error) {
    console.error("Error in GET request:", error);
    return NextResponse.json(
      { error: "Failed to fetch cards", details: error.message },
      { status: 500 }
    );
  }
}