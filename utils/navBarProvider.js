"use client";

import { useContext, createContext, useState } from "react";

const NavBarContext = createContext();

export const NavBarContextProvider = ({ children }) => {
    const [boolClick, setBoolCLick] = useState(true);
    return (
        <NavBarContext.Provider value={{ boolClick }}>
            {children}
        </NavBarContext.Provider>
    );
};

export const useNavBar = () => {
    return useContext(NavBarContext);
};