"use client";

import Link from "next/link";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./Firebase/firebase";
import { useRouter } from "next/navigation";
import { sendEmailVerification } from "firebase/auth";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { toast } from "sonner";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const cred = await signInWithEmailAndPassword(auth, username, password);
      const user = cred.user;

      if (!user.emailVerified) {
        await sendEmailVerification(user);
        toast.info(
          "Your login credentials are saved. Please verify your email and login again.",
          { position: "top-center" },
        );

        return;
      }

      router.push("/Appointments");
    } catch (err) {
      console.log(err);
      toast.warning(
        "Your login credentials could not be processed. Please check your credentials and try again.",
        { position: "top-center" },
      );
    }
  };

  return (
    <main
      className="flex flex-col items-center justify-center min-h-screen"
      style={{ backgroundColor: "#00AEEF" }}
    >
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
            fontSize: "24px",
            fontWeight: "bold",
          }}
        >
          Oak Bay Scheduler
        </p>

        <form className="flex flex-col gap-4 w-full" onSubmit={handleSubmit}>
          <Input
            className="bg-slate-50"
            type="text"
            name="username"
            placeholder="Email"
            value={username}
            onChange={(username) => setUsername(username.target.value)}
          />
          <InputGroup className="bg-slate-50 text-center">
            <InputGroupInput
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={password}
              onChange={(password) => setPassword(password.target.value)}
            ></InputGroupInput>
            <InputGroupAddon align="inline-end">
              {showPassword ? (
                <EyeOff
                  onClick={() => {
                    setShowPassword(!showPassword);
                  }}
                  style={{ cursor: "pointer" }}
                />
              ) : (
                <Eye
                  onClick={() => {
                    setShowPassword(!showPassword);
                  }}
                  style={{ cursor: "pointer" }}
                />
              )}
            </InputGroupAddon>
          </InputGroup>
          <Button
            className="bg-[#01488D] hover:bg-[#7BC043]/80 hover:text-white/60 cursor-pointer"
            type="submit"
          >
            Login
          </Button>
        </form>

        <p
          style={{ backgroundColor: "#000000", height: "1px", width: "100%" }}
        ></p>
        <p style={{ color: "#000000" }}>
          Forgot Password?{" "}
          <Link
            style={{ color: "#00AEEF", textDecoration: "underline" }}
            href="/Login/ResetPassword"
          >
            Click Here
          </Link>
        </p>
      </div>
    </main>
  );
}