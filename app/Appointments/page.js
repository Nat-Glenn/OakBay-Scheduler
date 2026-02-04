"use client"
import NavBarComp from "@/components/NavBarComp";
import { GrFormDown, GrFormNext, GrFormPrevious } from "react-icons/gr";
import React from "react"
import Link from "next/link"
import Image from "next/image"
import { useState } from "react";

export default function Appointments(){
    const [active, setActive] = useState(false);
    const time = ["9:00","9:15","9:30","9:45","10:00","10:15","10:30"]

    const manageActive = () => {
        setActive(prev => !prev);
    }

    return(
        <main className="flex min-h-dvh w-full">
            <NavBarComp/>
            <div className="flex-2 p-2">
                <div className="flex items-center p-4 border-b">
                    <p className="text-3xl">Schedule</p>
                </div>
                <div className="flex flex-row items-center justify-between gap-5">
                    <div className="flex flex-row items-center gap-2 p-4">
                        <GrFormPrevious width={5} height={5}/>
                        <GrFormNext width={5} height={5}/>
                        <p className="text-lg font-bold">March 3rd, 2026</p>
                        <GrFormDown width={5} height={5}/>
                    </div>
                    <Link href="/" className="bg-gray-500 hover:bg-gray-500/60 p-2 rounded-md">
                        <p className="text-white font-bold">Dr Brad Pritchard</p>
                    </Link>
                    <Link href="/" className="bg-[#A0CE66] hover:bg-[#A0CE66]/60 p-2 rounded-md">
                        <p className="text-center text-white font-bold">New Appointment</p>
                    </Link>
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

                            <div className="col-span-2 border p-1 text-center">
                                <div onClick={() => manageActive()} className="bg-[#00D0FF] hover:bg-[#00D0FF]/60 cursor-pointer flex flex-col rounded-md">
                                    <p className="font-extrabold text-white">John Doe</p>
                                    <p className="font-extralight text-sm text-white/80">Adjustment</p>
                                </div>
                            </div>
                            <div className="col-span-2 border p-2 text-center">—</div>
                            <div className="col-span-2 border p-2 text-center">—</div>
                            <div className="col-span-2 border p-2 text-center">—</div>
                        </React.Fragment>
                        ))}
                </div>
            </div>
            {active ? (
            <div className="flex-1 p-2">
                <div className="flex flex-col items-center bg-gray-300 rounded-md p-4 gap-4">
                    <div className="flex flex-col items-center">
                        <div className="flex flex-row items-center gap-4">
                            <Image className="rounded-full" src="/favicon.png" alt="logo" height={50} width={50}></Image>
                            <p>John Doe</p>
                        </div>
                        <div className="w-75">
                            <p><b>DoB:</b> June 01, 2000 (25)</p>
                            <p><b>Email:</b> johndoe@gmail.com</p>
                            <p><b>Phone Number:</b> 587-999-999</p>
                        </div>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="w-75 border-t">
                            <p className="font-extrabold text-lg">Appointment</p>
                            <p className="text-ellipsis"><b>Type:</b> Chiropractic Adjustment</p>
                            <p className="text-ellipsis"><b>Practitioner:</b> Dr. Brad Pritchard</p>
                        </div>
                        <div className="w-75 border-t">
                            <p className="font-extrabold text-lg">Notes</p>
                            <p className="text-ellipsis">Neck pain, Involved in car accident.</p>
                        </div>
                    </div>
                    <div className="flex flex-col items-center mt-auto">
                        <button className="w-50 rounded-lg m-1 p-2 px-4 bg-[#A0CE66] hover:bg-[#A0CE66]/60 text-center font-semibold text-white">
                            Check In
                        </button>
                        <button className="w-50 rounded-lg m-1 p-2 px-4 bg-[#C04343] hover:bg-[#C04343]/60 text-center font-semibold text-white">
                            Check Out
                        </button>
                        <button className="w-50 rounded-lg m-1 p-2 px-4 bg-[#002D58] hover:bg-[#002D58]/60 text-center font-semibold text-white">
                            Edit Appointment
                        </button>
                    </div>
                </div>
            </div>
            ) : (<div></div>)}
        </main>
    )
}