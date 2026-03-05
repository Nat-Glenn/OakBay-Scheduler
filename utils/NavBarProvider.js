"use client";

import { useContext, createContext, useState } from "react";

const NavBarContext = createContext();

export const NavBarProvider = ({ children }) => {
  const [navState, setNavState] = useState("closed");
  const handleOpen = () => {
    setNavState("open");
  };
  const handleClose = () => {
    if (navState === "open") {
      setNavState("closing");
    }
  };
  return (
    <NavBarContext.Provider
      value={{ navState, setNavState, handleOpen, handleClose }}
    >
      {children}
    </NavBarContext.Provider>
  );
};

export const useNavBar = () => {
  return useContext(NavBarContext);
};
