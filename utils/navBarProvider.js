"use client";

import { useContext, createContext, useState } from "react";

const NavBarContext = createContext();

export const NavBarContextProvider = ({ children }) => {
    const [boolClick, setBoolCLick] = useState(false);
    const handleBool = () => { setBoolCLick((prev) => !prev) }
    return (
        <NavBarContext.Provider value={{ boolClick, handleBool }}>
            {children}
        </NavBarContext.Provider>
    );
};

export const useNavBar = () => {
    return useContext(NavBarContext);
};