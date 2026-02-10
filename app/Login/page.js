"use client";

import Link from "next/link";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./Firebase/firebase";
import { useRouter } from "next/navigation";
import { sendEmailVerification } from "firebase/auth";
import Image from "next/image";
import { AlertCircleIcon, Eye, EyeOff } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [alert, setAlert] = useState("");

  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const cred = await signInWithEmailAndPassword(auth, username, password);
      const user = cred.user;

      if (!user.emailVerified) {
        await sendEmailVerification(user);
        setAlert("verify");
        return;
      }

      router.push("/Appointments");
    } catch (err) {
      console.log(err);
      setAlert("fail");
    }
  };

  return (
    <main
      className="flex flex-col items-center justify-center min-h-screen"
      style={{ backgroundColor: "#F0F0F0" }}
    >
      {alert == "fail" && (
        <Alert variant="destructive" className="fixed top-10 right-0 max-w-sm">
          <AlertCircleIcon />
          <AlertTitle>Login Failed</AlertTitle>
          <AlertDescription>
            Your login credentials could not be processed. Please check your
            credentials and try again.
          </AlertDescription>
        </Alert>
      )}
      {alert == "verify" && (
        <Alert className="fixed top-10 right-0 max-w-sm">
          <AlertCircleIcon />
          <AlertTitle>Verify Email</AlertTitle>
          <AlertDescription>
            Your login credentials are saved. Please verify your email and login
            again.
          </AlertDescription>
        </Alert>
      )}
      <div
        className="flex flex-col items-center gap-6"
        style={{
          backgroundColor: "#00AEEF",
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
            className="bg-white"
            type="text"
            name="username"
            placeholder="Email"
            value={username}
            onChange={(username) => setUsername(username.target.value)}
          />
          <InputGroup className="bg-white text-center">
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
            className="bg-[#7BC043] hover:bg-[#7BC043]/80 hover:text-white/60 cursor-pointer"
            type="submit"
          >
            Login
          </Button>
        </form>

        <p
          style={{ backgroundColor: "#000000", height: "1px", width: "100%" }}
        ></p>
        <p>
          Forgot Password?{" "}
          <Link
            style={{ color: "#FFFFFF", textDecoration: "underline" }}
            href="/Login/ResetPassword"
          >
            Click Here
          </Link>
        </p>
      </div>
    </main>
  );
}
