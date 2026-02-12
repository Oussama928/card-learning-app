import type {
  CardWithOwnerDTO,
  FavoritesResponseDTO,
  GetCardsResponseDTO,
  HandleFavoritesResponseDTO,
} from "@/types";
import { requestJson } from "./httpClient";

export interface CardsQuery {
  type: "official" | "community";
  page?: number;
  limit?: number;
}

export async function getCards(
  query: CardsQuery,
  accessToken: string
): Promise<GetCardsResponseDTO> {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;

  return requestJson<GetCardsResponseDTO>(
    `/api/getCards/type/${query.type}?page=${page}&limit=${limit}`,
    { method: "GET", token: accessToken }
  );
}

export async function getFavorites(accessToken: string): Promise<string[]> {
  const data = await requestJson<FavoritesResponseDTO>("/api/getFavorites", {
    method: "GET",
    token: accessToken,
  });

  return Array.isArray(data.favorites) ? data.favorites : [];
}

export async function toggleFavorite(
  cardId: string,
  intent: "add" | "remove",
  accessToken: string
): Promise<HandleFavoritesResponseDTO> {
  return requestJson<HandleFavoritesResponseDTO>("/api/handleFavorites", {
    method: "POST",
    token: accessToken,
    body: JSON.stringify({ card_id: cardId, intent }),
  });
}

export async function deleteCard(cardId: string, accessToken: string): Promise<void> {
  await requestJson(`/api/deleteCard/${cardId}`, {
    method: "DELETE",
    token: accessToken,
    body: JSON.stringify({ id: cardId }),
  });
}

export function normalizeCards(cards: CardWithOwnerDTO[] | undefined): CardWithOwnerDTO[] {
  if (!Array.isArray(cards)) return [];

  return cards.map((card) => ({
    ...card,
    total_words: Number(card.total_words ?? 0),
  }));
}
