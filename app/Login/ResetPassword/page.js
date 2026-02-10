"use client";

import Link from "next/link";

export default function ResetPassword() {


    return (
        <main className="flex flex-col items-center justify-center min-h-screen" style={{backgroundColor: '#F0F0F0'}}>
            <div className ="flex flex-col items-center gap-6" style={{backgroundColor: '#00AEEF', borderRadius: '20px', width: '400px', padding: '40px'}}>
            <img src="/favicon.png" width={100} height={100} style={{filter: 'drop-shadow(2px 2px #000000)'}}/>
            <p style={{textAlign: 'center', color: '#000000', fontSize: '24px', fontWeight: 'bold'}}>You will receive an email momentarily after submission</p>
            <form className="flex flex-col gap-4 w-full">
                <label style={{backgroundColor: '#FFFFFF', borderRadius: '10px', padding: '5px', textAlign: 'center', color: '#898989'}} type="input">Email</label>
            </form>
            <p style={{backgroundColor: '#000000', height: '1px', width: '100%'}}></p>
            </div>
        </main>
    )
}
