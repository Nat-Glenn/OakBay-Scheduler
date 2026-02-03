"use client"
import NavBarComp from "@/components/NavBarComp";
import { useNavBar } from "@/utils/navBarProvider"

export default function Home() {
    const boolClick = useNavBar();
  return (
    <main className={`flex flex-col items-center p-5 min-h-dvh w-full ${boolClick ? "overflow-hidden" : "overflow-y-auto"}`}>
      <NavBarComp/>
    </main>
  );
}
