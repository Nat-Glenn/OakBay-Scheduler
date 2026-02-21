"use client";

import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/app/Login/Firebase/firebase";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { toast } from "sonner";

export default function ResetPassword() {
  const [username, setUsername] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await sendPasswordResetEmail(auth, username);
      toast.info("Password reset email sent. Check your inbox.", {
        position: "top-center",
      });
      setUsername("");
      router.push("/Login");
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <main
      className="flex flex-col items-center justify-center min-h-screen"
      style={{ backgroundColor: "#00AEEF" }}
    >
      {/* alert logic maintained from original */}
      <div
        className="flex flex-col items-center gap-6"
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "20px",
          width: "400px",
          padding: "40px",
        }}
      >
        <Image
          src="/favicon.png"
          width={100}
          height={100}
          style={{ filter: "drop-shadow(2px 2px #000000)" }}
          alt="Oak Bay Scheduler"
        />

        <p
          style={{
            textAlign: "center",
            color: "#000000",
            fontSize: "12px",
            fontWeight: "bold",
          }}
        >
          You will receive an email momentarily after submission
        </p>

        <form className="flex flex-col gap-4 w-full" onSubmit={handleSubmit}>
          <Input
            className="text-center bg-slate-50"
            type="text"
            name="username"
            placeholder="Email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <Button
            className="bg-[#7BC043] hover:bg-[#7BC043]/80 hover:text-white/80 text-white cursor-pointer"
            type="submit"
          >
            Submit
          </Button>
        </form>

        <p
          style={{ backgroundColor: "#000000", height: "1px", width: "100%" }}
        />
      </div>
    </main>
  );
}