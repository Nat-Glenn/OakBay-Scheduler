"use client";

import { useState, useEffect, useRef } from "react";
import NavBarComp from "@/components/NavBarComp";
import { connectGoogleAccount, disconnectGoogleAccount } from "./connectAccount";
import { User, ShieldCheck, Lock, Link as LinkIcon, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const isMobile = useMediaQuery("(max-width: 768px)");
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
      const result = reader.result; 
      setUserPhoto(result);
      localStorage.setItem("admin_local_avatar", result);
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
    // min-h-screen allows the page to grow if content wraps
    <main className="flex flex-col min-h-screen w-full bg-background">
      <NavBarComp />
      
      <div className="flex flex-col flex-1 px-4 pb-8">
        <header className="py-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Settings</h1>
        </header>

        {/* Main Content Layout: Stack on mobile, side-by-side on md */}
        <div className="flex flex-col md:flex-row gap-6 items-start">
          
          {/* PROFILE SIDEBAR */}
          <aside className="w-full md:w-80 lg:w-96 flex-shrink-0">
            <Card className="border-foreground bg-background text-foreground shadow-sm">
              <CardHeader className="border-b border-foreground/20 pb-6">
                <div className="flex flex-row items-center gap-4">
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                  <div className="h-16 w-16 flex-shrink-0 rounded-2xl bg-ring/10 flex items-center justify-center border border-ring/20 overflow-hidden">
                    {userPhoto ? (
                      <img src={userPhoto} className="h-full w-full object-cover" alt="Profile" />
                    ) : (
                      <User className="text-ring" size={32} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-lg text-foreground leading-tight truncate">
                      {userName}
                    </p>
                    <p className="text-sm text-button-primary font-mono font-semibold uppercase tracking-wider">
                      Administrator
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-6 space-y-6">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-muted-foreground uppercase">Email Address</span>
                  <p className="text-sm text-foreground break-all font-medium">{userEmail}</p>
                </div>

                <div className="space-y-2 pt-2">
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
          </aside>

          {/* SECURITY MAIN CONTENT */}
          <section className="flex-1 w-full">
            <Card className="border-foreground bg-background text-foreground shadow-sm">
              <CardHeader className="border-b border-foreground/20">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={20} className="text-button-primary" />
                  <CardTitle className="text-lg uppercase tracking-tight">Security & Access</CardTitle>
                </div>
              </CardHeader>

              <CardContent className="p-6 lg:p-8">
                {/* Internal grid: Stacks on small screens, side-by-side on large */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                  
                  {/* Password Section */}
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <Lock size={16} className="text-button-primary" />
                      <span>Password Management</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Update your login credentials. We recommend using a unique password to protect your admin account.
                    </p>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="destructive" className="w-full sm:w-fit px-8 font-bold">Reset Password</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Confirm Password Reset</DialogTitle>
                          <DialogDescription>
                            This will send a secure reset link to <strong>{userEmail}</strong>. You will be logged out immediately.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-2 sm:gap-0">
                          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                          <Button variant="destructive" onClick={handleResetConfirm} disabled={resettingPassword}>
                            {resettingPassword ? "Sending..." : "Send Reset Email"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Google Connection Section */}
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <LinkIcon size={16} className="text-button-primary" />
                      <span>External Account Sync</span>
                    </div>
                    
                    <div className="flex-1">
                      {googleConnected ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 text-green-600 border border-green-500/20 rounded-lg text-xs font-black w-fit">
                            <Check size={14} strokeWidth={3}/> GOOGLE LINKED
                          </div>
                          <p className="text-sm text-muted-foreground">Your account is connected for one-tap sign-in.</p>
                          <Button 
                            variant="outline" 
                            className="w-full sm:w-fit font-bold border-foreground/20" 
                            onClick={handleDisconnectGoogle} 
                            disabled={disconnectingGoogle}
                          >
                            {disconnectingGoogle ? "Unlinking..." : "Disconnect Google"}
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-sm text-muted-foreground italic leading-relaxed">
                            Link your Google account to enable faster access and an additional layer of recovery.
                          </p>
                          <Button 
                            variant="secondary" 
                            className="w-full sm:w-fit px-8 font-bold" 
                            onClick={handleConnectGoogle} 
                            disabled={connectingGoogle}
                          >
                            {connectingGoogle ? "Linking..." : "Connect Google Account"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </main>
  );
} 