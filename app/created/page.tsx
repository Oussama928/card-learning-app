"use client";

import React, { useEffect } from "react";
import Card from "../components/card";
import Loading from "../components/loading";
import { useSession } from "next-auth/react";
import Edit from "../cardAdd/page";
import type { CardWithOwnerDTO, GetCardsResponseDTO } from "@/types";
import { Pagination } from "../components/Pagination";
import { getCardsByUser } from "@/services/cardService";

const Home = () => {
  const [loading, setLoading] = React.useState(true);
  const [cards, setCards] = React.useState<CardWithOwnerDTO[] | null>(null);
  const [Favorites, setFavorites] = React.useState<string[]>([]);
  const [isEditing, setIsEditing] = React.useState<[boolean, string]>([false, ""]);
  const [page, setPage] = React.useState(1);
  const pageSize = 12;
  const [pagination, setPagination] = React.useState({ page: 1, limit: pageSize, total: 0, totalPages: 1 });

  const { data: session } = useSession();

  useEffect(() => {
    const retrieve = async () => {
      try {
        setLoading(true);
        const token = (session?.user as any)?.accessToken;
        const userId = session?.user?.id;
        const data: GetCardsResponseDTO = await getCardsByUser(userId || "", page, pageSize, token);
        setCards(data.cards || []);
        setPagination(data.pagination || { page, limit: pageSize, total: 0, totalPages: 1 });

        // favorites
        const favRes = await fetch(`/api/getFavorites`, {
          method: "GET",
          headers: {
            authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const favData = await favRes.json();
        setFavorites(Array.isArray(favData.favorites) ? favData.favorites : []);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    if (session) retrieve();
  }, [session]);
  if (isEditing[0]) {
    return <Edit Current={isEditing[1]} />;
  }

  React.useEffect(() => {
    // fetch when page changes
    if (!session) return;
    const token = (session?.user as any)?.accessToken;
    (async () => {
      try {
        setLoading(true);
        const data: GetCardsResponseDTO = await getCardsByUser(session?.user?.id || "", page, pageSize, token);
        setCards(data.cards || []);
        setPagination(data.pagination || { page, limit: pageSize, total: 0, totalPages: 1 });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    })();
  }, [page, session]);

  return (
    <div>
      {loading || !cards || !Favorites ? (
        <Loading />
      ) : (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3  xl:grid-cols-4 gap-4 p-4 px-12 pt-12">
            {cards?.map((card) => (
              <Card
                delete_item={true}
                setCards={setCards}
                setIsEditing={setIsEditing}
                key={card.id}
                data={card}
                isfavorited={Favorites.includes(card.id)}
              />
            ))}
          </div>
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
            className="pb-10"
          />
        </div>
      )}
    </div>
  );
};

export default Home;
