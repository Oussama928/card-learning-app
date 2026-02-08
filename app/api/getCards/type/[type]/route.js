import { NextResponse } from "next/server";
import db from "../../../../../lib/db";
import { authenticateRequest } from "../../../authenticateRequest";

export async function GET(request, { params }) {
  try {
    const { type } = await params;
    const userId = await authenticateRequest(request);
    let getCardsQuery = '';
    if (type === "community") {
      getCardsQuery = `
      select cards.* from cards left join users on cards.user_id = users.id where users.role = 'user'
  `;
    } else if (type === "official") {
      getCardsQuery = `
      select cards.* from cards left join users on cards.user_id = users.id where users.role = 'admin'
  `;
    } else {
      return NextResponse.json(
        { error: "wrong type" },
        { status: 402 }
      );
    }

    const cardsResult = await db.queryAsync(getCardsQuery);
    const cards = cardsResult.rows;
    const userIds = cards.map((card) => card.user_id);
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
    return NextResponse.json(
      { error: "Failed to fetch cards" },
      { status: 500 }
    );
  }
}
