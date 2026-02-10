"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Card from "../components/card";
import Loading from "../components/loading";
import { useSession } from "next-auth/react";
import type { CardWithOwnerDTO, GetCardsResponseDTO } from "@/types";

interface CardsPageInternalProps {
  type: "official" | "community";
  readyCards?: CardWithOwnerDTO[];
}

const Home: React.FC<CardsPageInternalProps> = ({ type, readyCards }) => {
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<CardWithOwnerDTO[] | null>(null);
  const [Favorites, setFavorites] = useState<string[]>([]);
  const { data: session } = useSession();

  useEffect(() => {
    if (!session) return; // Prevent fetching before session exists

    const retrieveCards = async () => {
      try {
        const res = await fetch(`/api/getCards/type/${type}`, {
          method: "GET",
          headers: {
            authorization: `Bearer ${(session?.user as any)?.accessToken}`,
            "Content-Type": "application/json",
          },
        });
        const data: GetCardsResponseDTO = await res.json();
        setCards(Array.isArray(data.cards) ? data.cards : []);
        console.log("Cards:", data.cards);
      } catch (error) {
        console.error("Error fetching cards:", error);
        setCards([]);
      }
    };

    const retrieveFavorites = async () => {
      try {
        const res = await fetch("/api/getFavorites", {
          method: "GET",
          headers: {
            authorization: `Bearer ${(session?.user as any)?.accessToken}`,
            "Content-Type": "application/json",
          },
        });
        const data = await res.json();
        setFavorites(Array.isArray(data.favorites) ? data.favorites : []);
      } catch (error) {
        console.error("Error fetching favorites:", error);
      }
    };

    if (type === "official" && readyCards) {
      setCards(readyCards);
    } else if (type === "official" || type === "community") {
      retrieveCards();
    }
    retrieveFavorites();
    setLoading(false);
    
  }, [session, readyCards]);

  useEffect(() => {
    console.log("Updated favorites:", Favorites);
  }, [Favorites]);

  return (
    <div>
      {loading || !cards ? (
        <Loading />
      ) : cards?.length === 0 ? (
        <div className="mx-auto flex items-center justify-center flex-col "> 
          <h1 className="text-black mt-8 mb-[100px] text-5xl alegreya-bold">
            Unfortunately, there are no items at the moment.
          </h1>
          <Image src="/sad.svg" width={500} height={500} alt="Sad face" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 px-12 pt-12">
          {cards && cards.map((card) => (
            <Card key={card.id} delete_item={false} data={card} isfavorited={Favorites.includes(card.id)} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
