import { NextRequest, NextResponse } from "next/server";
import db from "../../../../../lib/db";

interface CardWithOwner {
  id: string;
  title: string;
  user_id: string;
  owner: any;
  [key: string]: any;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;

  try {
    const getCardsQuery = `SELECT * FROM cards WHERE user_id = $1`;
    const cardsResult = await db.queryAsync(getCardsQuery, [id]);
    const cards: CardWithOwner[] = cardsResult.rows;

    const userQuery = `SELECT id, username, email, image FROM users WHERE id = $1`;
    const userResult = await db.queryAsync(userQuery, [id]);
    const user = userResult.rows;

    if (user.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (cards.length === 0) {
      return NextResponse.json(
        { error: "No cards found for this user" },
        { status: 404 }
      );
    }

    const cardsWithOwner = cards.map((card) => ({
      ...card,
      owner: user[0],
    }));

    return NextResponse.json(cardsWithOwner);
  } catch (error: any) {
    console.error("Error fetching user cards:", error);
    return NextResponse.json(
      { error: "Failed to fetch user cards" },
      { status: 500 }
    );
  }
}
