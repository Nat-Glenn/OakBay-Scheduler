"use client";

import { useState, useEffect, useRef } from "react";
import NavBarComp from "@/components/NavBarComp";
import { connectGoogleAccount, disconnectGoogleAccount } from "./connectAccount";
import { User, ShieldCheck, Lock, KeyRound, Link as LinkIcon, Check, Unlink, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useMediaQuery } from "@/utils/UseMediaQuery";
import { toast } from "sonner";
import { auth } from "@/app/Login/Firebase/firebase";
import { onAuthStateChanged, getMultiFactorResolver, PhoneMultiFactorGenerator } from "firebase/auth";
import { setPendingMfa } from "@/app/Login/TwoFactor/mfaStore";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { sendAdminPasswordReset } from "./resetpassword";

export default function Settings() {
  const [googleConnected, setGoogleConnected] = useState(false);
  const [connectingGoogle, setConnectingGoogle] = useState(false);
  const [disconnectingGoogle, setDisconnectingGoogle] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [userName, setUserName] = useState("Admin User");
  const [userEmail, setUserEmail] = useState("");
  const [userPhoto, setUserPhoto] = useState(null);

  const fileInputRef = useRef(null);
  const small = useMediaQuery("(max-width: 768px)");
  const router = useRouter();

  useEffect(() => {
    const savedPhoto = localStorage.getItem("admin_local_avatar");
    if (savedPhoto) setUserPhoto(savedPhoto);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserName(user.displayName || user.email?.split("@")[0] || "Admin User");
        setUserEmail(user.email || "");
        if (!savedPhoto && user.photoURL) setUserPhoto(user.photoURL);

        const isLinked = user.providerData.some(p => p.providerId === "google.com");
        setGoogleConnected(isLinked);
      } else {
        setGoogleConnected(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) return toast.error("Image must be under 1MB.");
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setUserPhoto(reader.result);
      localStorage.setItem("admin_local_avatar", reader.result);
      toast.success("Photo updated locally.");
    };
    reader.readAsDataURL(file);
  };

  const handleConnectGoogle = async () => {
    try {
      setConnectingGoogle(true);
      await connectGoogleAccount();
      toast.success("Google account linked successfully!");
    } catch (error) {
      if (error?.code === "auth/multi-factor-auth-required") {
        const resolver = getMultiFactorResolver(auth, error);
        const phoneHint = resolver.hints.find(h => h.factorId === PhoneMultiFactorGenerator.FACTOR_ID);
        if (phoneHint) {
          setPendingMfa({ resolver, hint: phoneHint, selectedHintUid: phoneHint.uid, postMfaRedirect: "/Settings", mfaContext: "connect-google" });
          router.push("/Login/TwoFactor");
          return;
        }
      }
      toast.error(error?.message || "Failed to link Google.");
    } finally {
      setConnectingGoogle(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    try {
      setDisconnectingGoogle(true);
      await disconnectGoogleAccount();
      toast.success("Google disconnected.");
    } catch (error) {
      toast.error("Failed to disconnect.");
    } finally {
      setDisconnectingGoogle(false);
    }
  };

  const handleResetConfirm = async () => {
    try {
      setResettingPassword(true);
      await sendAdminPasswordReset(userEmail);
      toast.info("Reset email sent.");
      router.push("/Login");
    } catch (err) {
      toast.error("Error sending reset email.");
    } finally {
      setResettingPassword(false);
    }
  };

  return (
    <main className="flex flex-col h-dvh w-full bg-background overflow-hidden">
      <NavBarComp />
      
      <div className="flex flex-col px-4 pb-4 overflow-hidden">
        {/* PAGE HEADER */}
        <header className="py-4">
          {!small && <h1 className="text-3xl font-bold text-foreground">Settings</h1>}
        </header>

        {/* MAIN CONTENT AREA - Matches Patients Layout */}
        <div className="flex flex-col md:flex-row gap-4 min-h-0 overflow-hidden">
          
          {/* PROFILE CARD - Acts as the "Sidebar" (md:w-1/4) */}
          <div className="flex w-full md:w-1/4">
            <Card className="flex flex-col w-full border-foreground bg-background text-foreground overflow-hidden">
              <CardHeader className="border-b border-foreground/30 pb-6">
                <div className="flex flex-row items-center gap-4">
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                  <div className="h-14 w-14 rounded-2xl bg-ring/20 flex items-center justify-center border border-ring/30 overflow-hidden">
                    {userPhoto ? (
                      <img src={userPhoto} className="h-full w-full object-cover" />
                    ) : (
                      <User className="text-ring" size={28} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xl text-foreground leading-tight truncate">
                      {userName}
                    </p>
                    <p className="text-sm text-button-primary font-mono truncate">
                      Admin
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 pt-6 flex-1 overflow-y-auto scrollbar-rounded">
                <div className="space-y-4">
                  
                  <div className="grid gap-4 text-sm">
                    <div className="flex justify-between flex-col">
                      <span className="text-muted-foreground font-bold">Email</span>
                      <span className="text-foreground truncate">{userEmail}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 space-y-2">
                   <Button 
                    variant="secondary" 
                    className="w-full font-bold"
                    onClick={() => fileInputRef.current?.click()}
                   >
                    Change Photo
                  </Button>
                  {userPhoto && (
                    <Button 
                      variant="ghost" 
                      className="w-full text-destructive hover:bg-destructive/10" 
                      onClick={() => { setUserPhoto(null); localStorage.removeItem("admin_local_avatar"); }}
                    >
                      <Trash2 size={16} className="mr-2" /> Remove Photo
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-1 min-h-0">
            <Card className="flex flex-col w-full border-foreground bg-background text-foreground">
              <CardHeader className=" border-b border-foreground">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={20} className="text-button-primary" />
                  <CardTitle className="text-lg">Security & Access</CardTitle>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  
                  {/* Password Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Lock size={16} className="text-button-primary" />
                      <p>Password Management</p>
                    </div>
                    <p className="text-sm text-muted-foreground">Update your login credentials securely.</p>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="destructive" className="w-full md:w-auto px-8">Reset Password</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Confirm Reset</DialogTitle></DialogHeader>
                        <DialogFooter>
                          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                          <Button variant="destructive" onClick={handleResetConfirm} disabled={resettingPassword}>
                            {resettingPassword ? "Sending..." : "Continue"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Google Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <LinkIcon size={16} className="text-button-primary" />
                      <p>Google Account Connection</p>
                    </div>
                    <div className="space-y-4">
                      {googleConnected ? (
                        <>
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#a0ce66]/10 text-[#a0ce66] border border-[#a0ce66]/20 rounded-md text-xs font-bold w-fit">
                            <Check size={14}/> LINKED
                          </div>
                          <Button 
                            variant="outline" 
                            className="w-full md:w-auto" 
                            onClick={handleDisconnectGoogle} 
                            disabled={disconnectingGoogle}
                          >
                            {disconnectingGoogle ? "Unlinking..." : "Disconnect Google"}
                          </Button>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-muted-foreground italic">Enable one-tap login by connecting your Google account.</p>
                          <Button 
                            variant="secondary" 
                            className="w-full md:w-auto px-8" 
                            onClick={handleConnectGoogle} 
                            disabled={connectingGoogle}
                          >
                            {connectingGoogle ? "Linking..." : "Connect Google"}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </main>
  );
}