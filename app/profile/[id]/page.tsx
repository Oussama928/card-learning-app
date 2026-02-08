"use client"
import React from "react";
import Infos from "../../components/Profile_infos";

import { useParams } from "next/navigation";

const Profile = () => {
  const id = useParams().id;
  return (
    <div className="w-full ">
      <Infos id={id} />
    </div>
  );
};

export default Profile;
