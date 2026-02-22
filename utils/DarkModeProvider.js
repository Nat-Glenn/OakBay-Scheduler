"use client";

import { useContext, createContext, useState } from "react";

const DarkModeContext = createContext();

export const DarkModeProvider = ({ children }) => {
  const [boolDark, setBoolDark] = useState(false);
  const handleBool = () => {
    setBoolDark((prev) => !prev);
  };
  return (
    <DarkModeContext.Provider value={{ boolDark, handleBool }}>
      {children}
    </DarkModeContext.Provider>
  );
};

export const useDarkMode = () => {
  return useContext(DarkModeContext);
};
