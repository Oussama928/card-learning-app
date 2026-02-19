import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { authenticateRequest } from "../../authenticateRequest";
import { cache } from "@/lib/cache";
import { handleApiError } from "@/lib/apiHandler";
import type { CardOwnership } from "@/types";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;

  try {
    const userId = await authenticateRequest(request);

    const cardResult = await db.queryAsync(
      `
      SELECT cards.id, users.role
      FROM cards
      INNER JOIN users ON users.id = cards.user_id
      WHERE cards.id = $1 AND cards.user_id = $2
      `,
      [id, userId]
    );
    const card = cardResult.rows[0] as CardOwnership | undefined;

    if (!card) {
      return NextResponse.json(
        { error: "Card not found or access denied" },
        { status: 404 }
      );
    }

    await db.queryAsync(`DELETE FROM words WHERE card_id = $1`, [id]);

    const result = await db.queryAsync(`DELETE FROM cards WHERE id = $1`, [id]);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Failed to delete card" },
        { status: 500 }
      );
    }

    const cardsNamespace = card.role === "admin" ? "cards:official" : "cards:community";
    await cache.bumpNamespaceVersion(cardsNamespace);
    await cache.bumpNamespaceVersion("search");

    return NextResponse.json({
      success: true,
      message: "Card and all associated words deleted successfully",
      deletedCardId: id,
    });
  } catch (error: unknown) {
    return handleApiError(error, request);
  }
}
