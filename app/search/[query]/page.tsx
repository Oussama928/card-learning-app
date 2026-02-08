"use client";
import { useParams } from "next/navigation";
import React, { useState, useEffect } from "react";
import { signOut, signIn, useSession } from "next-auth/react";
import CardsPage from "../../components/cardsPage";

const page = () => {
  const search = useParams().query;
  const { data: session, status } = useSession();
  const [cards, setCards] = useState([false]);

  useEffect(() => {
    const handleSearch = async () => {
      try {
        const response = await fetch(
          `/api/search?searchQuery=${search}&page=1`,
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

        console.log("Search success");
        const data = await response.json();
        console.log("srearch data : ", data);
        setCards(data);
      } catch (error) {
        console.error("Error:", error);
      }
    };
    handleSearch();
  }, [search]);
  
  

  return (
    <div>
      <h1 className="flex items-center justify-center text-black text-3xl mt-10" >Search results for "{search}"</h1>
      <CardsPage type={"official"} readyCards={cards} />
    </div>
  );
};

export default page;
