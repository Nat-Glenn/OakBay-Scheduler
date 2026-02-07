import Link from "next/link";
import Image from "next/image";
import { GrMoney, GrPower, GrScorecard, GrSettingsOption, GrTask, GrUserManager } from "react-icons/gr";

export default function MenuComp() {
    return (
            <div onClick={(event) => event.stopPropagation()} className="flex flex-col bg-[#00AEEF]">
                <Link href="/" className="self-center p-4">
                    <Image src="/logo.png" alt="Logo" width={100} height={50}></Image>
                </Link>
                <Link href="./Appointments/" className="my-1 p-4 flex flex-row items-center gap-2 font-bold text-white hover:bg-[#098cbc]">
                    <GrScorecard width={6} height={6} />
                    Appointments
                </Link> 
                <Link href="./Billing/" className="my-1 p-4 flex flex-row items-center gap-2 font-bold text-white hover:bg-[#098cbc]">
                    <GrMoney width={6} height={6} />
                    Billing
                </Link>
                <Link href="./Practitioners/" className="my-1 p-4 flex flex-row items-center gap-2 font-bold text-white hover:bg-[#098cbc]">
                    <GrUserManager width={6} height={6} />
                    Practitioners
                </Link> 
                <Link href="./Summary/" className="my-1 p-4 flex flex-row items-center gap-2 font-bold text-white hover:bg-[#098cbc]">
                    <GrTask width={6} height={6} />
                    Summary
                </Link>  
                <Link href="./PatientProfiles/" className="my-1 p-4 flex flex-row items-center gap-2 font-bold text-white hover:bg-[#098cbc]">
                    <GrTask width={6} height={6} />
                    Patient Profile
                </Link>  
                <Link href="./Settings/" className="my-1 p-4 flex flex-row items-center gap-2 font-bold text-white hover:bg-[#098cbc]">
                    <GrSettingsOption width={6} height={6} />
                    Settings
                </Link> 
                <button className="mt-auto p-4 flex flex-row items-center gap-2 font-bold text-white hover:bg-[#098cbc]">
                    <GrPower width={6} height={6} />
                    Sign Out
                </button> 
            </div>
    )
}