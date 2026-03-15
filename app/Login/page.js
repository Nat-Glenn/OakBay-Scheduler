"use client";

import Link from "next/link";
import { useState } from "react";
import {
  signInWithEmailAndPassword,
  sendEmailVerification,
  getMultiFactorResolver,
  PhoneMultiFactorGenerator,
} from "firebase/auth";
import { auth } from "./Firebase/firebase";
import { signInWithGoogle } from "./GoogleSignIn/googleAuth";
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
import { Card, CardContent } from "@/components/ui/card";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  const router = useRouter();

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);

      await signInWithGoogle();

      toast.success("Successfully signed in with Google!", {
        position: "top-center",
      });

      router.push("/Home");
    } catch (error) {
      if (error?.code === "auth/multi-factor-auth-required") {
        const resolver = getMultiFactorResolver(auth, error);
        const phoneHint = resolver.hints.find(
          (h) => h.factorId === PhoneMultiFactorGenerator.FACTOR_ID,
        );

        if (phoneHint) {
          setPendingMfa({
            resolver,
            hint: phoneHint,
            selectedHintUid: phoneHint.uid,
          });
          router.push("/Login/TwoFactor");
          return;
        }

        toast.error(
          "A second factor is required, but no supported phone factor was found.",
          {
            position: "top-center",
          },
        );
        return;
      }

      if (error?.code === "auth/internal-error") {
        const message = error?.message || "";

        if (auth.currentUser) {
          toast.success("Successfully signed in with Google!", {
            position: "top-center",
          });
          router.push("/Home");
          return;
        }

        if (
          message.includes(
            "Google login is only allowed after the account has been connected in Settings.",
          )
        ) {
          toast.error(
            "Google login is only available for existing accounts.",
            {
              position: "top-center",
            },
          );
          return;
        }
      }

      console.error(error);
      toast.error("Google login failed.", {
        position: "top-center",
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoginLoading(true);

      const cred = await signInWithEmailAndPassword(auth, username, password);
      const user = cred.user;

      if (!user.emailVerified) {
        await sendEmailVerification(user);
        toast.info("Please verify your email and login again.", {
          position: "top-center",
        });
        return;
      }

      router.push("/");
    } catch (err) {
      if (err?.code === "auth/multi-factor-auth-required") {
        const resolver = getMultiFactorResolver(auth, err);
        const phoneHint = resolver.hints.find(
          (h) => h.factorId === PhoneMultiFactorGenerator.FACTOR_ID,
        );

        if (phoneHint) {
          setPendingMfa({
            resolver,
            hint: phoneHint,
            selectedHintUid: phoneHint.uid,
          });
          router.push("/Login/TwoFactor");
          return;
        }
      }

      toast.warning("Invalid credentials. Please try again.", {
        position: "top-center",
      });
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-sidebar">
      <Card className="flex flex-col w-full max-w-md items-center shadow-2xl transition-colors duration-300">
        <CardContent className="flex flex-col w-full gap-4 items-center">
          <Image
            src="/favicon.png"
            width={90}
            height={90}
            style={{ filter: "drop-shadow(2px 2px #000000)" }}
            alt="Oak Bay Scheduler"
          />

          <h1 className="text-foreground text-2xl font-bold">
            Oak Bay Scheduler
          </h1>

          <form className="flex flex-col gap-4 w-full" onSubmit={handleSubmit}>
            <Input
              className="h-12"
              type="email"
              name="username"
              placeholder="Email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="email"
            />

            <InputGroup className="border-border border h-12">
              <InputGroupInput
                className="h-full"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <InputGroupAddon align="inline-end">
                {showPassword ? (
                  <EyeOff
                    onClick={() => setShowPassword(false)}
                    style={{ cursor: "pointer" }}
                  />
                ) : (
                  <Eye
                    onClick={() => setShowPassword(true)}
                    style={{ cursor: "pointer" }}
                  />
                )}
              </InputGroupAddon>
            </InputGroup>

            <Button
              className="bg-button-primary h-12"
              type="submit"
              disabled={loginLoading}
            >
              {loginLoading ? "Logging in..." : "Login"}
            </Button>
          </form>

          <div className="flex flex-col items-center gap-2 w-full mt-2">
            <p className="text-muted-foreground text-[10px] uppercase tracking-widest font-bold">
              Or Login using
            </p>

            <button
              onClick={handleGoogleSignIn}
              type="button"
              disabled={googleLoading}
              className="w-11 h-11 rounded-full bg-background border border-border flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100"
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

          <p className="text-muted-foreground text-[10px] tracking-widest font-bold text-center">
            Google login will not work if email isn&apos;t already registered in database.
          </p>

          <Link
            className="text-[#00AEEF] hover:text-[#00AEEF]/80 text-sm font-medium underline underline-offset-4"
            href="/Login/ResetPassword"
          >
            Forgot Password?
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}