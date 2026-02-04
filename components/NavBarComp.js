"use client"
import { useNavBar } from "@/utils/navBarProvider";
import MenuComp from "./Menu"

export default function NavBarComp() {
    const { boolClick } = useNavBar();
    return (
        <div className="flex self-stretch">
            {boolClick && <MenuComp/>}
        </div>
    )
}