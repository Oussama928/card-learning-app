"use client";

import React, { useEffect } from "react";
import Card from "../components/card";
import Loading from "../components/loading";
import { useSession } from "next-auth/react";
const favorites = () => {
  const [loading, setLoading] = React.useState(true);
  const [cards, setCards] = React.useState(null);
  const [Favorites, setFavorites] = React.useState([]);
  const { data: session } = useSession();
  console.log(session);

  useEffect(() => {
    const retrieveFavorites = async () => {
      const res = await fetch(
        `http://localhost:3000/api/getFavorites`,
        {
          method: "GET",
          headers: {
            authorization: `Bearer ${session?.user?.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
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

  return (
    <div>
      {loading || !cards || !Favorites ? (
        <Loading />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3  xl:grid-cols-4 gap-4 p-4 px-12 pt-12">
          {Array.from({ length: cards.length }).map((_, index) => (
            <Card
              delete_item={false}
              setCards={setCards}
              key={index}
              data={cards[index]}
              isfavorited={() => {
                console.log(Favorites);
                return Favorites.includes(cards[index].id);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default favorites;
