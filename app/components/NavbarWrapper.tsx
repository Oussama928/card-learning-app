// app/components/NavbarWrapper.tsx
import React from "react";
import Navbar from "./Navbar";
import { auth } from "@/auth";

const NavbarWrapper = async () => {
  const session = await auth();
  return <Navbar  />;
};

export default NavbarWrapper;
