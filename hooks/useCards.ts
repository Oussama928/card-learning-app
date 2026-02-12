"use client";

import { useCallback, useEffect, useState } from "react";
import type { CardWithOwnerDTO, PaginationDTO } from "@/types";
import { getCards, getFavorites, normalizeCards } from "@/services/cardService";

interface UseCardsOptions {
  type: "official" | "community";
  token?: string;
  initialPage?: number;
  initialLimit?: number;
}

export function useCards({ type, token, initialPage = 1, initialLimit = 20 }: UseCardsOptions) {
  const [cards, setCards] = useState<CardWithOwnerDTO[] | null>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationDTO>({
    page: initialPage,
    limit: initialLimit,
    total: 0,
    totalPages: 1,
  });

  const fetchCards = useCallback(
    async (page = initialPage, limit = initialLimit) => {
      if (!token) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [cardsRes, favs] = await Promise.all([
          getCards({ type, page, limit }, token),
          getFavorites(token),
        ]);

        setCards(normalizeCards(cardsRes.cards));
        setFavorites(favs);
        setPagination(cardsRes.pagination);
      } catch (err: unknown) {
        setCards([]);
        setError(err instanceof Error ? err.message : "Failed to fetch cards");
      } finally {
        setLoading(false);
      }
    },
    [token, type, initialPage, initialLimit]
  );

  useEffect(() => {
    void fetchCards();
  }, [fetchCards]);

  return {
    cards: cards ?? [],
    setCards,
    favorites,
    setFavorites,
    loading,
    error,
    pagination,
    refetch: fetchCards,
  };
}
