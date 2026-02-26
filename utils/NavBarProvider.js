"use client";

import { useContext, createContext, useState } from "react";

const NavBarContext = createContext();

export const NavBarProvider = ({ children }) => {
  const [boolOpen, setBoolOpen] = useState(false);
  const handleOpen = () => {
    setBoolOpen((prev) => !prev);
  };
  return (
    <NavBarContext.Provider value={{ boolOpen, handleOpen }}>
      {children}
    </NavBarContext.Provider>
  );
};

export const useNavBar = () => {
  return useContext(NavBarContext);
};
