import React from 'react'
import CardsPage from "../components/cardsPage";

export const revalidate = 300;

const OfficialPage = () => {
  return (
    <CardsPage type={"official"} />
  )
}

export default OfficialPage