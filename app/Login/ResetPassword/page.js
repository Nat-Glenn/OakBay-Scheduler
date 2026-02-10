"use client";

import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/app/Login/Firebase/firebase"; 
import { useRouter } from "next/navigation";

export default function ResetPassword() {
  const [username, setUsername] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await sendPasswordResetEmail(auth, username);
      alert("Password reset email sent. Check your inbox / spam.");
      setUsername("");
      router.push("/Login");
    } 
    catch (err) {
      console.log(err);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen" style={{ backgroundColor: "#F0F0F0" }}>
      <div className="flex flex-col items-center gap-6" style={{backgroundColor: "#00AEEF", borderRadius: "20px", width: "400px", padding: "40px"}}>
        <img src="/favicon.png" width={100} height={100} style={{ filter: "drop-shadow(2px 2px #000000)" }} alt="Oak Bay Scheduler"/>

        <p style={{ textAlign: "center", color: "#000000", fontSize: "12px", fontWeight: "bold"}}>
          You will receive an email momentarily after submission</p>

        <form className="flex flex-col gap-4 w-full" onSubmit={handleSubmit}>
          <input style={{backgroundColor: "#FFFFFF", borderRadius: "10px", padding: "5px", textAlign: "center", color: "#898989"}}
            type="text" name="username" placeholder="Email" value={username} onChange={(e) => setUsername(e.target.value)}/>

          <button style={{backgroundColor: "#7BC043", color: "white", padding: "5px", borderRadius: "10px", cursor: "pointer"}}
            type="submit">Submit</button>
        </form>

        <p style={{ backgroundColor: "#000000", height: "1px", width: "100%" }} />
      </div>
    </main>
  );
}
