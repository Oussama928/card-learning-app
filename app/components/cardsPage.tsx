"use client";

import React from "react";
import Image from "next/image";
import Card from "../components/card";
import Loading from "../components/loading";
import type { CardWithOwnerDTO } from "@/types";
import { useCards } from "@/hooks/useCards";
import { useAuthState } from "@/app/context/AuthStateContext";

interface CardsPageInternalProps {
  type: "official" | "community";
  readyCards?: CardWithOwnerDTO[];
}

const Home: React.FC<CardsPageInternalProps> = ({ type, readyCards }) => {
  const { accessToken } = useAuthState();
  const [page, setPage] = React.useState(1);
  const { cards, setCards, favorites, loading, error, pagination, refetch } = useCards({
    type,
    token: accessToken,
  });

  const renderedCards = type === "official" && readyCards ? readyCards : cards;

  React.useEffect(() => {
    if (type === "official" && readyCards) return;
    void refetch(page, pagination.limit);
  }, [page, pagination.limit, refetch, readyCards, type]);

  return (
    <div>
      {loading ? (
        <Loading />
      ) : error ? (
        <div className="mx-auto flex items-center justify-center flex-col">
          <h1 className="text-red-700 mt-8 mb-[40px] text-2xl alegreya-bold">
            {error}
          </h1>
        </div>
      ) : renderedCards.length === 0 ? (
        <div className="mx-auto flex items-center justify-center flex-col "> 
          <h1 className="text-black mt-8 mb-[100px] text-5xl alegreya-bold">
            Unfortunately, there are no items at the moment.
          </h1>
          <Image src="/sad.svg" width={500} height={500} alt="Sad face" />
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 px-12 pt-12">
            {renderedCards.map((card) => (
              <Card
                key={card.id}
                delete_item={false}
                data={card}
                setCards={setCards}
                isfavorited={favorites.includes(card.id)}
              />
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pb-10">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                className="rounded-md bg-slate-200 px-4 py-2 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-slate-700">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((prev) => Math.min(prev + 1, pagination.totalPages))}
                className="rounded-md bg-slate-200 px-4 py-2 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Home;
