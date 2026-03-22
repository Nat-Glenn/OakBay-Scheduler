"use client";

import { useState, useEffect } from "react";
import NavBarComp from "@/components/NavBarComp";
import {
  connectGoogleAccount,
  disconnectGoogleAccount,
  isGoogleConnected,
} from "./connectAccount";
import {
  User,
  ShieldCheck,
  Save,
  Lock,
  KeyRound,
  Link as LinkIcon,
  Check,
  Unlink,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useMediaQuery } from "@/utils/UseMediaQuery";
import { toast } from "sonner";
import { auth } from "@/app/Login/Firebase/firebase";
import {
  getMultiFactorResolver,
  PhoneMultiFactorGenerator,
} from "firebase/auth";
import { setPendingMfa } from "@/app/Login/TwoFactor/mfaStore";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { sendAdminPasswordReset } from "./resetpassword";

export default function Settings() {
  const [isSaving, setIsSaving] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [connectingGoogle, setConnectingGoogle] = useState(false);
  const [disconnectingGoogle, setDisconnectingGoogle] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  const small = useMediaQuery("(max-width: 768px)");
  const router = useRouter();

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 800);
  };

  useEffect(() => {
    setGoogleConnected(isGoogleConnected());
  }, []);

  const handleConnectGoogle = async () => {
    try {
      setConnectingGoogle(true);

      await connectGoogleAccount();
      setGoogleConnected(true);

      toast.success("Google account successfully connected!");
    } catch (error) {
      console.error(error);

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
            postMfaRedirect: "/Settings",
            mfaContext: "connect-google",
          });

          router.push("/Login/TwoFactor");
          return;
        }

        toast.error(
          "A second factor is required, but no supported phone factor was found.",
        );
        return;
      }

      if (error?.code === "auth/provider-already-linked") {
        setGoogleConnected(true);
        toast.info("Google account is already connected.");
        return;
      }

      if (error?.code === "auth/popup-closed-by-user") {
        toast.warning("Google connection was cancelled.");
        return;
      }

      if (error?.code === "auth/credential-already-in-use") {
        toast.error("That Google account is already linked to another user.");
        return;
      }

      toast.error(error?.message || "Failed to connect Google account.");
    } finally {
      setConnectingGoogle(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    try {
      setDisconnectingGoogle(true);

      await disconnectGoogleAccount();
      setGoogleConnected(false);

      toast.success("Google account disconnected.");
    } catch (error) {
      console.error(error);
      toast.error(error?.message || "Failed to disconnect Google account.");
    } finally {
      setDisconnectingGoogle(false);
    }
  };

  const handleResetConfirm = async () => {
    try {
      const email = auth.currentUser?.email;

      if (!email) {
        toast.error("No authenticated email found.", {
          position: "top-right",
        });
        return;
      }

      setResettingPassword(true);

      await sendAdminPasswordReset(email);

      toast.info("Password reset email sent. Check your inbox.", {
        position: "top-right",
      });

      router.push("/Login");
    } catch (err) {
      console.error(err);
      toast.error("Could not send password reset email.", {
        position: "top-right",
      });
    } finally {
      setResettingPassword(false);
    }
  };

  return (
    <main className="flex flex-col h-dvh w-full bg-background overflow-hidden">
      <NavBarComp />

      <div className="flex flex-col overflow-hidden px-4 pb-4">
        {/* Page Header & Save Action */}
        <header className="py-4 flex justify-between items-end">
          {!small ? (
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          ) : (
            <div>&nbsp;</div>
          )}

          <Button variant="third" onClick={handleSave} disabled={isSaving}>
            <Save size={18} />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </header>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto space-y-4 pb-8 scrollbar-rounded min-h-0">
          
          {/* Admin Profile Section */}
          <Card className="border-foreground bg-background">
            <CardHeader>
              <div className="flex items-center gap-2 text-foreground">
                <User size={20} />
                <CardTitle>Admin Profile</CardTitle>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Profile Photo Sub-section */}
              <div className="flex items-center gap-4 pb-2">
                <div className="h-20 w-20 rounded-full bg-background border-2 flex items-center justify-center">
                  <User size={36} />
                </div>
                <Button variant="secondary" size="lg">
                  Change Photo
                </Button>
              </div>

              {/* Profile Details Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-foreground">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input placeholder="Admin User" />
                </div>

                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input placeholder="admin@chiropractic.com" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security & Access Section */}
          <Card className="bg-background">
            <CardHeader>
              <div className="flex items-center gap-2 text-foreground">
                <ShieldCheck size={20} />
                <CardTitle>Security & Access</CardTitle>
              </div>
            </CardHeader>

            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-10">
              
              {/* Password Management Block */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Lock size={16} className="text-muted-foreground" />
                  <p>Password Management</p>
                </div>

                <p className="text-sm text-muted-foreground">
                  Securely update your administrative credentials using email
                  verification.
                </p>

                {/* Reset Password Modal/Dialog */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="destructive">
                      <KeyRound size={16} />
                      Reset Account Password
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="sm:max-w-[425px] text-center">
                    <DialogHeader className="items-center text-center">
                      <DialogTitle>Reset Password</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to reset your password?
                        <br />
                        If you continue, a reset email will be sent and you will
                        be logged out.
                      </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="flex flex-col items-center justify-center gap-2 sm:flex-row sm:justify-center">
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>

                      <Button
                        variant="destructive"
                        onClick={handleResetConfirm}
                        disabled={resettingPassword}
                      >
                        {resettingPassword ? "Sending..." : "Continue"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Google Integration Block */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <LinkIcon size={16} className="text-muted-foreground" />
                  <p>Google Account</p>
                </div>

                <p className="text-sm text-muted-foreground">
                  Connect your Google account to sign in faster and securely.
                </p>

                {/* Conditional Connection Buttons */}
                {googleConnected ? (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      className="bg-green-600 hover:bg-green-600/80 cursor-default"
                      disabled
                    >
                      <Check size={16} />
                      Connected
                    </Button>

                    <Button
                      variant="outline"
                      onClick={handleDisconnectGoogle}
                      disabled={disconnectingGoogle}
                    >
                      <Unlink size={16} />
                      {disconnectingGoogle
                        ? "Disconnecting..."
                        : "Disconnect Google"}
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={handleConnectGoogle}
                    disabled={connectingGoogle}
                    variant="secondary"
                  >
                    <LinkIcon size={16} />
                    {connectingGoogle ? "Connecting..." : "Connect Google"}
                  </Button>
                )}
              </div>
              
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}