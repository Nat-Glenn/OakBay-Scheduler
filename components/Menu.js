import Link from "next/link";
import Image from "next/image";
import { GrMenu } from "react-icons/gr";

export default function MenuComp({ closeNav }) {
    return (
        <div onClick={closeNav} className="fixed inset-0 flex bg-gray-700/60 items-start  z-2">
            <div onClick={(event) => event.stopPropagation()} className="w-1/4 h-full flex flex-col bg-[#00AEEF] p-4 gap-4">
                <GrMenu onClick={closeNav} className='absolute left-10 top-5 w-6 h-6' />
                <Image className="self-center" src="/logo.png" alt="Logo" width={100} height={50}></Image>
                <Link className="mx-4" href="./Appointments/">Appointments</Link>
                <Link className="mx-4" href="">Billing</Link>
                <Link className="mx-4" href="">Practitioners</Link>
                <Link className="mx-4" href="">Summary</Link>
            </div>
        </div>
    )
}