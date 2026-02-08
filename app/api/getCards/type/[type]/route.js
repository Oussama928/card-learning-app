import { NextResponse } from "next/server";
import db from "../../../../../lib/db";
import { authenticateRequest } from "../../../authenticateRequest";

export async function GET(request, { params }) {
  try {
    const { type } = await params;
    const userId = await authenticateRequest(request);
    
    // Parse pagination params
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;
    
    let getCardsQuery = '';
    let countQuery = '';
    
    if (type === "community") {
      countQuery = `
        SELECT COUNT(*) as total 
        FROM cards 
        LEFT JOIN users ON cards.user_id = users.id 
        WHERE users.role = 'user'
      `;
      getCardsQuery = `
        SELECT cards.* 
        FROM cards 
        LEFT JOIN users ON cards.user_id = users.id 
        WHERE users.role = 'user'
        ORDER BY cards.id DESC
        LIMIT $1 OFFSET $2
      `;
    } else if (type === "official") {
      countQuery = `
        SELECT COUNT(*) as total 
        FROM cards 
        LEFT JOIN users ON cards.user_id = users.id 
        WHERE users.role = 'admin'
      `;
      getCardsQuery = `
        SELECT cards.* 
        FROM cards 
        LEFT JOIN users ON cards.user_id = users.id 
        WHERE users.role = 'admin'
        ORDER BY cards.id DESC
        LIMIT $1 OFFSET $2
      `;
    } else {
      return NextResponse.json(
        { error: "wrong type" },
        { status: 402 }
      );
    }

    // Get total count
    const countResult = await db.queryAsync(countQuery);
    const total = parseInt(countResult.rows[0]?.total || '0', 10);

    // Get paginated cards
    const cardsResult = await db.queryAsync(getCardsQuery, [limit, offset]);
    const cards = cardsResult.rows;
    
    if (cards.length > 0) {
      const userIds = cards.map((card) => card.user_id);
      const placeholders = userIds.map((_, i) => `$${i + 1}`).join(',');
      const getOwnersQuery = `SELECT * FROM users WHERE id IN (${placeholders})`;
      const ownersResult = await db.queryAsync(getOwnersQuery, userIds);
      const owners = ownersResult.rows;

      const ownersMap = owners.reduce((map, owner) => {
        map[owner.id] = owner;
        return map;
      }, {});

      for (const card of cards) {
        card.owner = ownersMap[card.user_id];
      }
    }

    return NextResponse.json({
      cards,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching cards:", error);
    
    if (error.status === 401) {
      return NextResponse.json(
        error.json || { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to fetch cards" },
      { status: 500 }
    );
  }
}
