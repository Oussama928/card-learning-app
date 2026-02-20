"use client";
import { useParams } from "next/navigation";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import CardsPage from "../../components/cardsPage";
import type { CardWithOwnerDTO, SearchResponseDTO } from "@/types";
import { Pagination } from "../../components/Pagination";

const page = () => {
  const searchParam = useParams().query;
  const search = Array.isArray(searchParam) ? searchParam.join(" ") : searchParam;
  const { data: session, status } = useSession();
  const [cards, setCards] = useState<CardWithOwnerDTO[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 12;

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    const handleSearch = async () => {
      try {
        const response = await fetch(
          `/api/search?searchQuery=${search}&page=${page}&limit=${limit}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session?.user?.accessToken}`,
            },
          }
        );

        if (!response.ok) {
          console.error("Failed to search");
          return;
        }

        const data: SearchResponseDTO = await response.json();
        setCards(data.results || []);
        setTotalPages(data.pagination?.totalPages || 1);
      } catch (error) {
        console.error("Error:", error);
      }
    };
    if (search) {
      handleSearch();
    }
  }, [search, session?.user?.accessToken, page]);
  
  

  return (
    <div>
      <h1 className="flex items-center justify-center text-black text-3xl mt-10" >Search results for "{search}"</h1>
      <CardsPage type={"official"} readyCards={cards} />
      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        className="pb-10"
      />
    </div>
  );
};

export default page;
