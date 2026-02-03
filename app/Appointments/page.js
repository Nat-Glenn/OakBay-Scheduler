"use client"
import NavBarComp from "@/components/NavBarComp";
import { useNavBar } from "@/utils/navBarProvider";
import { GrFormDown, GrFormNext, GrFormPrevious } from "react-icons/gr";
import React from "react"

export default function Appointments(){
    const boolClick = useNavBar();
    const time = ["9:00","9:15","9:30"]
    return(
        <main className={`flex flex-col items-center p-5 min-h-dvh w-full ${boolClick ? "overflow-hidden" : "overflow-y-auto"}`}>
            <NavBarComp/>
            <div>
                <div className="flex flex-row items-center gap-5">
                    <div className="flex flex-row items-center gap-2">
                        <GrFormPrevious width={5} height={5}/>
                        <GrFormNext width={5} height={5}/>
                        <p className="text-lg font-bold">March 3rd, 2026</p>
                        <GrFormDown width={5} height={5}/>
                    </div>
                    <button className="bg-gray-500 p-4 rounded-md">
                        <p className="text-md font-bold">Dr Brad Pritchard</p>
                    </button>
                    <button className="bg-[#A0CE66] p-4 rounded-md">
                        <p className="text-center font-bold">New Appointment</p>
                    </button>
                </div>
                <div className="grid grid-cols-9 m-4 border">
                    <div className="col-span-1 font-bold text-center border">
                        Time
                    </div>
                    <div className="col-span-2 font-bold text-center border">
                        Slot 1
                    </div>
                    <div className="col-span-2 font-bold text-center border">
                        Slot 2
                    </div>
                    <div className="col-span-2 font-bold text-center border">
                        Slot 3
                    </div>
                    <div className="col-span-2 font-bold text-center border">
                        Slot 4
                    </div>
                    {time.map((hours) => 
                        (
                        <React.Fragment key={hours}>
                            <div className="col-span-1 text-center border p-2 font-medium" key={hours.key}>
                                {hours}
                            </div>

                            <div className="col-span-2 border p-2 text-center">—</div>
                            <div className="col-span-2 border p-2 text-center">—</div>
                            <div className="col-span-2 border p-2 text-center">—</div>
                            <div className="col-span-2 border p-2 text-center">—</div>
                        </React.Fragment>
                        ))}
                </div>
            </div>
        </main>
    )
}