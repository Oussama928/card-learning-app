import { NextRequest, NextResponse } from "next/server";
import db from "../../../../../lib/db";
import { authenticateRequest } from "../../../authenticateRequest";
import type { ApiErrorResponseDTO, CardWithOwnerDTO, GetCardsResponse } from "@/types";
import { cache, cacheKeys } from "@/lib/cache";
import { rateLimitOrThrow } from "@/lib/rateLimit";
import { handleApiError } from "@/lib/apiHandler";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
): Promise<NextResponse<GetCardsResponse | ApiErrorResponseDTO>> {
  try {
    const { type } = await params;
    const userId = await authenticateRequest(request);
    await rateLimitOrThrow({
      request,
      keyPrefix: "rl:cards",
      points: 120,
      duration: 60,
      userId,
    });

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const requestedLimit = parseInt(url.searchParams.get("limit") || "20", 10);
    const limit = Math.min(Math.max(requestedLimit, 1), 50);
    const offset = (page - 1) * limit;

    const cardsVersion = await cache.getNamespaceVersion(`cards:${type}`);
    const cacheKey = cacheKeys.cardsByType(type, page, limit, cardsVersion);
    const cached = await cache.getJSON<GetCardsResponse>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    let getCardsQuery = "";
    let countQuery = "";

    if (type === "community") {
      countQuery = `
        SELECT COUNT(*) as total 
        FROM cards 
        LEFT JOIN users ON cards.user_id = users.id 
        WHERE users.role = 'user'
      `;
      getCardsQuery = `
        SELECT cards.*,
               json_build_object(
                 'id', users.id,
                 'username', users.username,
                 'email', users.email,
                 'image', users.image
               ) as owner
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
        SELECT cards.*,
               json_build_object(
                 'id', users.id,
                 'username', users.username,
                 'email', users.email,
                 'image', users.image
               ) as owner
        FROM cards 
        LEFT JOIN users ON cards.user_id = users.id 
        WHERE users.role = 'admin'
        ORDER BY cards.id DESC
        LIMIT $1 OFFSET $2
      `;
    } else {
      return NextResponse.json(
        { success: false, error: "wrong type" },
        { status: 402 }
      );
    }

    const countResult = await db.queryAsync(countQuery);
    const total = parseInt(countResult.rows[0]?.total || "0", 10);

    const cardsResult = await db.queryAsync(getCardsQuery, [limit, offset]);
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

    await cache.setJSON(cacheKey, response, 30);

    return NextResponse.json(response);
  } catch (error: any) {
    if (error.status === 401) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    return handleApiError(error, request);
  }
}
