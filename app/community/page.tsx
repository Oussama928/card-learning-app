import React from 'react'
import CardsPage from "../components/cardsPage";

export const revalidate = 300;

const CommunityPage = () => {
  return (
    <CardsPage type={"community"} />
  )
}

export default CommunityPage