"use client";

import Link from "next/link";
import { useState } from "react";
import {
  signInWithEmailAndPassword,
  sendEmailVerification,
  getMultiFactorResolver,
  PhoneMultiFactorGenerator,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "./Firebase/firebase";
import { setPendingMfa } from "./TwoFactor/mfaStore";
import { useRouter } from "next/navigation";
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

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast.success("Successfully signed in with Google!", { position: "top-center" });
      router.push("/Appointments");
    } catch (error) {
      console.error(error);
      toast.error("Google login failed.", { position: "top-center" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const cred = await signInWithEmailAndPassword(auth, username, password);
      const user = cred.user;
      if (!user.emailVerified) {
        await sendEmailVerification(user);
        toast.info("Please verify your email and login again.", { position: "top-center" });
        return;
      }
      router.push("/Appointments");
    } catch (err) {
      if (err?.code === "auth/multi-factor-auth-required") {
        const resolver = getMultiFactorResolver(auth, err);
        const phoneHint = resolver.hints.find(h => h.factorId === PhoneMultiFactorGenerator.FACTOR_ID);
        if (phoneHint) {
          setPendingMfa({ resolver, hint: phoneHint, selectedHintUid: phoneHint.uid });
          router.push("/Login/TwoFactor");
          return;
        }
      }
      toast.warning("Invalid credentials. Please try again.", { position: "top-center" });
    }
  };

  return (
    // Replaced hardcoded blue with your CSS background variable
    <main className="flex flex-col items-center justify-center min-h-screen bg-[#00AEEF]">
      <div
        className="flex flex-col items-center gap-6 shadow-2xl transition-colors duration-300"
        style={{
          // Uses your CSS variable: white in light mode, oklch(0.18 0 0) in dark mode
          backgroundColor: "var(--card)",
          borderRadius: "24px",
          width: "420px",
          padding: "40px",
        }}
      >
        <Image
          src="/favicon.png"
          width={90}
          height={90}
          style={{ filter: "drop-shadow(2px 2px #000000)" }}
          alt="Oak Bay Scheduler"
        />

        {/* Uses text-foreground to flip between black and white automatically */}
        <h1 className="text-foreground text-2xl font-bold">Oak Bay Scheduler</h1>

        <form className="flex flex-col gap-4 w-full" onSubmit={handleSubmit}>
          <Input
            className="bg-background border border-border rounded-md h-12"
            type="text"
            name="username"
            placeholder="Email"
            value={username}
            onChange={(username) => setUsername(username.target.value)}
          />

          <InputGroup className="bg-background border border-border rounded-md h-12 ">
            <InputGroupInput
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={password}
              onChange={(password) => setPassword(password.target.value)}
            />
            <InputGroupAddon align="inline-end">
              {showPassword ? (
                <EyeOff
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ cursor: "pointer" }}
                />
              ) : (
                <Eye
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ cursor: "pointer" }}
                />
              )}
            </InputGroupAddon>
          </InputGroup>

          <Button
            className="bg-button-primary h-12 "
            type="submit"
          >
            Login
          </Button>
        </form>

        <div className="flex flex-col items-center gap-4 w-full mt-2">
          <p className="text-muted-foreground text-[10px] uppercase tracking-widest font-bold">
            Sign up using
          </p>

          <button
            onClick={handleGoogleSignIn}
            type="button"
            className="w-11 h-11 rounded-full bg-background border border-border flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-all shadow-md"
          >
            <Image
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              width={22}
              height={22}
            />
          </button>
        </div>

        <div className="h-[1px] w-full bg-border mt-2"></div>

        <Link
          className="text-[#00AEEF] hover:text-[#00AEEF]/80 text-sm font-medium underline underline-offset-4"
          href="/Login/ResetPassword"
        >
          Forgot Password?
        </Link>
      </div>
    </main>
  );
}