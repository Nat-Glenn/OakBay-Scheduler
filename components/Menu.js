"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { GrMoney, GrPower, GrScorecard, GrSettingsOption, GrTask, GrUser, GrUserManager } from "react-icons/gr";
import { signOut } from "firebase/auth";
import { auth } from "@/app/Login/Firebase/firebase";

export default function MenuComp() {
    const router = useRouter();
    const pathname = usePathname();

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            router.replace("/Login");
        } catch (err) {
            console.log(err);
            alert("Sign out failed.");
        }
    };

    const CurrentPage = (href) => {
        const isActive = pathname === href || pathname.startsWith(href + "/");
        
        return `my-1 p-4 flex flex-row items-center gap-2 font-bold transition-all duration-200 ${
            isActive 
            ? "bg-[#098cbc] text-white shadow-inner border-r-4 border-[#A0CE66]" 
            : "text-white hover:bg-[#098cbc] hover:text-white/90"       
        }`;
    };

    return (
        <div 
            onClick={(event) => event.stopPropagation()} 
            className="flex flex-col w-64 min-h-screen bg-[#00AEEF] border-r border-white/5 shadow-2xl"
        >
            {/* Logo Section */}
            <Link href="/" className="self-center p-4">
                <Image src="/logo.png" alt="Logo" width={100} height={50} priority />
            </Link>
            
            {/* Navigation Links */}
            <nav className="flex flex-col flex-1">
                <Link href="/Appointments" className={CurrentPage("/Appointments")}>
                    <GrScorecard />
                    Appointments
                </Link> 
                
                <Link href="/Billing" className={CurrentPage("/Billing")}>
                    <GrMoney />
                    Billing
                </Link>
                
                <Link href="/Practitioners" className={CurrentPage("/Practitioners")}>
                    <GrUserManager />
                    Practitioners
                </Link> 
                
                <Link href="/Summary" className={CurrentPage("/Summary")}>
                    <GrTask />
                    Summary
                </Link>  
                
                <Link href="/PatientProfiles" className={CurrentPage("/PatientProfiles")}>
                    <GrUser />
                    Patient Profile
                </Link>  
                
                <Link href="/Settings" className={CurrentPage("/Settings")}>
                    <GrSettingsOption />
                    Settings
                </Link> 

                {/* Sign Out Section */}
                <button 
                    onClick={handleSignOut} 
                    className="mt-auto p-4 flex flex-row items-center gap-2 font-bold text-white hover:bg-[#002D58] hover:text-[#A0CE66] transition-all border-t border-white/5"
                >
                    <GrPower />
                    Sign Out
                </button> 
            </nav>
        </div>
    );
}