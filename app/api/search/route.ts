import { NextRequest, NextResponse } from "next/server";
import db from "../../../lib/db";
import { authenticateRequest } from "../authenticateRequest";
import type { CardWithOwnerDTO, SearchResponseDTO } from "@/types";
import { cache, cacheKeys } from "@/lib/cache";
import { rateLimitOrThrow } from "@/lib/rateLimit";
import { handleApiError } from "@/lib/apiHandler";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const userId = await authenticateRequest(request);
    await rateLimitOrThrow({
      request,
      keyPrefix: "rl:search",
      points: 60,
      duration: 60,
      userId,
    });

    const { searchQuery, page } = Object.fromEntries(
      new URL(request.url).searchParams
    );
    console.log(searchQuery, page);

    if (!searchQuery || typeof searchQuery !== "string") {
      return NextResponse.json(
        { error: "Missing search query" },
        { status: 400 }
      );
    }

    const pageNumber = parseInt(page as string, 10) || 1;
    if (isNaN(pageNumber) || pageNumber < 1) {
      return NextResponse.json(
        { error: "Invalid page number" },
        { status: 400 }
      );
    }
    const limit = 10;
    const offset = (pageNumber - 1) * limit;

    const searchVersion = await cache.getNamespaceVersion("search");
    const cacheKey = cacheKeys.search(searchQuery, pageNumber, limit, searchVersion);
    const cached = await cache.getJSON<SearchResponseDTO>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const countQuery = `
      SELECT COUNT(*) as total
      FROM cards
      WHERE to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, ''))
            @@ plainto_tsquery('simple', $1)
    `;

    const searchQueryQuery = `
      SELECT *,
             ts_rank(
               to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, '')),
               plainto_tsquery('simple', $1)
             ) as rank
      FROM cards
      WHERE to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, ''))
            @@ plainto_tsquery('simple', $1)
      ORDER BY rank DESC, id DESC
      LIMIT $2 OFFSET $3
    `;
    console.log(searchQuery);

    const countResult = await db.queryAsync(countQuery, [searchQuery]);
    const total = parseInt(countResult.rows[0]?.total || "0", 10);

    const cardsResult = await db.queryAsync(searchQueryQuery, [searchQuery, limit, offset]);
    const cards: CardWithOwnerDTO[] = cardsResult.rows;

    const results: CardWithOwnerDTO[] = cards.length ? cards : [];

    const userIds = results.map((card) => card.user_id).filter(Boolean) as string[];

    if (!userIds.length) {
      return NextResponse.json({
        results: results.map((card) => ({
          ...card,
          type: "cards",
        })),
        pagination: {
          page: pageNumber,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      } as SearchResponseDTO);
    }

    const placeholders = userIds.map((_, i) => `$${i + 1}`).join(",");
    const getOwnersQuery = `
      SELECT * FROM users WHERE id IN (${placeholders})
    `;

    const ownersResult = await db.queryAsync(getOwnersQuery, userIds);
    const owners = ownersResult.rows;

    const ownersMap = owners.reduce(
      (map: Record<string, any>, owner: any) => {
        map[owner.id] = owner;
        return map;
      },
      {}
    );

    for (const card of results) {
      card.owner = ownersMap[card.user_id];
    }

    const response: SearchResponseDTO = {
      results: results.map((card) => ({
        ...card,
        type: "cards",
      })),
      pagination: {
        page: pageNumber,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    await cache.setJSON(cacheKey, response, 30);

    return NextResponse.json(response);
  } catch (error: any) {
    return handleApiError(error, request);
  }
}
