import { NextRequest, NextResponse } from "next/server";
import db from "../../../../../lib/db";
import type { CardWithOwnerDTO, OwnerSummaryDTO } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;

  try {
    const getCardsQuery = `SELECT * FROM cards WHERE user_id = $1`;
    const cardsResult = await db.queryAsync(getCardsQuery, [id]);
    const cards = (cardsResult.rows || []) as CardWithOwnerDTO[];

    const userQuery = `SELECT id, username, email, image FROM users WHERE id = $1`;
    const userResult = await db.queryAsync(userQuery, [id]);
    const user = userResult.rows[0] as OwnerSummaryDTO | undefined;

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (cards.length === 0) {
      return NextResponse.json(
        { error: "No cards found for this user" },
        { status: 404 }
      );
    }

    const cardsWithOwner: CardWithOwnerDTO[] = cards.map((card) => ({
      ...card,
      owner: user,
    }));

    return NextResponse.json(cardsWithOwner);
  } catch (error: unknown) {
    console.error("Error fetching user cards:", error);
    return NextResponse.json(
      { error: "Failed to fetch user cards" },
      { status: 500 }
    );
  }
}
