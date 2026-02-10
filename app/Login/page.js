"use client";

import Link from "next/link";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./Firebase/firebase";
import { useRouter } from "next/navigation";
import { sendEmailVerification } from "firebase/auth";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  let x = "/hidelogo.png";

  if (!showPassword) {
    x = "/showlogo.png";
  }

  const router = useRouter();

const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const cred = await signInWithEmailAndPassword(auth, username, password);
    const user = cred.user;

    if (!user.emailVerified) {
      await sendEmailVerification(user);
      alert("Check your email to verify your account, then log in again.");
      return;
    }

    router.push("/PatientProfiles");
  } catch (err) {
    console.log(err);
    alert("Login failed. Please check your credentials and try again.");
  }
};

  return (
    <main className="flex flex-col items-center justify-center min-h-screen"style={{backgroundColor: "#F0F0F0"}}>
      <div className="flex flex-col items-center gap-6" style={{backgroundColor: "#00AEEF", borderRadius: "20px", width: "400px", padding: "40px",}}>
        <img src="/favicon.png" width={100} height={100}style={{ filter: "drop-shadow(2px 2px #000000)" }} alt="Oak Bay Scheduler"/>
        <p style={{textAlign: "center",color: "#000000",fontSize: "24px",fontWeight: "bold",}}>Oak Bay Scheduler</p>

        <form className="flex flex-col gap-4 w-full" onSubmit={handleSubmit}>
          <input style={{backgroundColor: "#FFFFFF",borderRadius: "10px", padding: "5px", textAlign: "center", color: "#898989"}}
            type="text" name="username" placeholder="Email" value={username} onChange={(username) => setUsername(username.target.value)}/>

        <div className="flex flex-row items-center" style={{backgroundColor: "#FFFFFF", borderRadius: "10px", padding: "5px", textAlign: "center", color: "#898989"}}>
          <input style={{flex:1, textAlign: "center", marginLeft:"20px"}} type={showPassword ? "text" : "password"} name="password" placeholder="Password" value={password} onChange={(password) => setPassword(password.target.value)}/>
            <img src={x} height={20} width={20} onClick={() => {setShowPassword(!showPassword)}} style={{cursor: "pointer"}}/>
            </div>

          <button style={{backgroundColor: "#7BC043", color: "white", padding: "5px", borderRadius: "10px"}}
            type="submit"  >Login</button>
        </form>

        <p style={{backgroundColor: "#000000", height: "1px", width: "100%" }}></p>
        <p>Forgot Password? <Link style={{ color: "#FFFFFF", textDecoration: "underline" }} href="/ResetPassword">Click Here</Link>
        </p>
      </div>
    </main>
  );
}
