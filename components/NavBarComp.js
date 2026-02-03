"use client"
import { GrMenu } from 'react-icons/gr'
import { useNavBar } from "@/utils/navBarProvider";
import MenuComp from "./Menu"

export default function NavBarComp() {
    const { boolClick, handleBool } = useNavBar();
    const handleClick = handleBool;
    return (
        <div className="relative z-40 flex w-full justify-center">
            <GrMenu onClick={handleClick} className='absolute left-5 w-6 h-6' />
            {boolClick && <MenuComp closeNav={handleClick}/>}
        </div>
    )
}