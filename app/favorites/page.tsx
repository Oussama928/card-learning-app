"use client";

import React, { useEffect } from "react";
import Card from "../components/card";
import Loading from "../components/loading";
import { useSession } from "next-auth/react";
import type { CardWithOwnerDTO } from "@/types";
import { Pagination } from "../components/Pagination";

const favorites = () => {
  const [loading, setLoading] = React.useState(true);
  const [cards, setCards] = React.useState<CardWithOwnerDTO[] | null>(null);
  const [Favorites, setFavorites] = React.useState<string[]>([]);
  const [page, setPage] = React.useState(1);
  const pageSize = 12;
  const { data: session } = useSession();
  console.log(session);

  useEffect(() => {
    const retrieveFavorites = async () => {
      const res = await fetch(`/api/getFavorites`, {
        method: "GET",
        headers: {
          authorization: `Bearer ${(session?.user as any)?.accessToken}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      console.log(data);
      setFavorites(() => {
        console.log("Updated favorites:", data.favorites);
        return data.favorites;
      });
      setCards(data.fullFavorites);
      console.log(Favorites);
    };

    try {
      retrieveFavorites();
      setLoading(false);
    } catch (error) {
      console.log(error);
    }
  }, [session]);

  const totalPages = cards ? Math.max(1, Math.ceil(cards.length / pageSize)) : 1;
  const pagedCards = cards ? cards.slice((page - 1) * pageSize, page * pageSize) : [];

  React.useEffect(() => {
    if (!cards) return;
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [cards, page, totalPages]);

  return (
    <div>
      {loading || !cards || !Favorites ? (
        <Loading />
      ) : (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3  xl:grid-cols-4 gap-4 p-4 px-12 pt-12">
            {pagedCards.map((card) => (
              <Card
                delete_item={false}
                setCards={setCards}
                removeOnUnfavorite={true}
                key={card.id}
                data={card}
                isfavorited={Favorites.includes(card.id)}
              />
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            className="pb-10"
          />
        </div>
      )}
    </div>
  );
};

export default favorites;
