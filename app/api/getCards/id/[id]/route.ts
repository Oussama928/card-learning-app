import { NextRequest, NextResponse } from "next/server";
import db from "../../../../../lib/db";
import { authenticateRequest } from "../../authenticateRequest";
import type { CardWithOwnerDTO, OwnerSummaryDTO, GetCardsResponse } from "@/types";
import { handleApiError } from "@/lib/apiHandler";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<GetCardsResponse | { error: string }>> {
  try {
    const userIdFromToken = await authenticateRequest(request);
    const { id } = await params;

    // Only allow the authenticated user to view their own created cards
    if (Number(id) !== Number(userIdFromToken)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const requestedLimit = parseInt(url.searchParams.get("limit") || "12", 10);
    const limit = Math.min(Math.max(requestedLimit, 1), 100);
    const offset = (page - 1) * limit;

    const countQuery = `SELECT COUNT(*) as total FROM cards WHERE user_id = $1`;
    const countResult = await db.queryAsync(countQuery, [id]);
    const total = parseInt(countResult.rows[0]?.total || "0", 10);

    const getCardsQuery = `
      SELECT cards.*,
             json_build_object(
               'id', users.id,
               'username', users.username,
               'email', users.email,
               'image', users.image
             ) as owner
      FROM cards
      LEFT JOIN users ON cards.user_id = users.id
      WHERE users.id = $1
      ORDER BY cards.id DESC
      LIMIT $2 OFFSET $3
    `;

    const cardsResult = await db.queryAsync(getCardsQuery, [id, limit, offset]);
    const cards: CardWithOwnerDTO[] = cardsResult.rows;

    const response: GetCardsResponse = {
      cards,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    return handleApiError(error, request as NextRequest);
  }
}
