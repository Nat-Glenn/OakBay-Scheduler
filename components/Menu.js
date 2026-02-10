import Link from "next/link";
import Image from "next/image";
import { GrMoney, GrPower, GrScorecard, GrSettingsOption, GrTask, GrUser, GrUserManager } from "react-icons/gr";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/app/Login/Firebase/firebase";


export default function MenuComp() {
    const router = useRouter();

    const handleSignOut = async () => {
        try {
        await signOut(auth);
        router.replace("/Login");
        } catch (err) {
        console.log(err);
        alert("Sign out failed.");
        }
    };

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
                    <GrUser width={6} height={6} />
                    Patient Profile
                </Link>  
                <Link href="./Settings/" className="my-1 p-4 flex flex-row items-center gap-2 font-bold text-white hover:bg-[#098cbc]">
                    <GrSettingsOption width={6} height={6} />
                    Settings
                </Link> 
                <button onClick={handleSignOut} className="mt-auto p-4 flex flex-row items-center gap-2 font-bold text-white hover:bg-[#098cbc]">
                    <GrPower width={6} height={6} />
                    Sign Out
                </button> 
            </div>
    )
}