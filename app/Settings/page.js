"use client";

import { useState, useEffect, useRef } from "react";
import NavBarComp from "@/components/NavBarComp";
// External logic for Firebase account linking
import { connectGoogleAccount, disconnectGoogleAccount } from "./connectAccount";
import { User, ShieldCheck, Lock, Link as LinkIcon, Check, Trash2, Camera } from "lucide-react";
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
  /* STATE MANAGEMENT*/
  const [googleConnected, setGoogleConnected] = useState(false);
  const [connectingGoogle, setConnectingGoogle] = useState(false);
  const [disconnectingGoogle, setDisconnectingGoogle] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  
  // User Profile States
  const [userName, setUserName] = useState("Admin User");
  const [userEmail, setUserEmail] = useState("");
  const [userPhoto, setUserPhoto] = useState(null);

  const fileInputRef = useRef(null); 
  const router = useRouter();

  /* AUTHENTICATION & INITIAL LOAD */
  useEffect(() => {
    // 1. Load locally stored avatar if it exists (for instant UI feedback)
    const savedPhoto = localStorage.getItem("admin_local_avatar");
    if (savedPhoto) setUserPhoto(savedPhoto);

    // 2. Listen for Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Set basic user info
        setUserName(user.displayName || user.email?.split("@")[0] || "Admin User");
        setUserEmail(user.email || "");
        
        // Use Firebase photo if no local override exists
        if (!savedPhoto && user.photoURL) setUserPhoto(user.photoURL);

        // Check if "google.com" exists in the provider list
        const isLinked = user.providerData.some(p => p.providerId === "google.com");
        setGoogleConnected(isLinked);
      } else {
        setGoogleConnected(false);
      }
    });
    
    return () => unsubscribe();
  }, []);

  /* PROFILE PHOTO HANDLING */
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side size validation (1MB limit)
    if (file.size > 1024 * 1024) return toast.error("Image must be under 1MB.");
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result; 
      setUserPhoto(result);
      // Persist the image to local storage as a Base64 string
      localStorage.setItem("admin_local_avatar", result);
      toast.success("Photo updated locally.");
    };
    reader.readAsDataURL(file);
  };

  /* ACCOUNT LINKING */
  const handleConnectGoogle = async () => {
    try {
      setConnectingGoogle(true);
      await connectGoogleAccount();
      toast.success("Google account linked successfully!");
    } catch (error) { 
      // Handle Multi-Factor Authentication (MFA) requirement during linking
      if (error?.code === "auth/multi-factor-auth-required") {
        const resolver = getMultiFactorResolver(auth, error);
        const phoneHint = resolver.hints.find(h => h.factorId === PhoneMultiFactorGenerator.FACTOR_ID);
        
        if (phoneHint) {
          // Store MFA data globally so the TwoFactor page can pick it up
          setPendingMfa({ 
            resolver, 
            hint: phoneHint, 
            selectedHintUid: phoneHint.uid, 
            postMfaRedirect: "/Settings", 
            mfaContext: "connect-google" 
          });
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

  /* PASSWORD RESET */
  const handleResetConfirm = async () => {
    try {
      setResettingPassword(true);
      // Logic located in resetpassword.ts
      await sendAdminPasswordReset(userEmail);
      toast.info("Reset email sent.");
      // Security best practice: force re-login after password reset request
      router.push("/Login");
    } catch (err) {
      toast.error("Error sending reset email.");
    } finally {
      setResettingPassword(false);
    }
  };

  return (
    <main className="flex flex-col min-h-screen w-full bg-background">
      <NavBarComp />
      
      <div className="flex flex-col flex-1 px-4 md:px-8 pb-8">
        <header className="py-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Settings</h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          
          {/* PROFILE SECTION */}
          <Card className="border-foreground bg-background text-foreground shadow-sm flex flex-col">
            <CardHeader className="border-b border-foreground/20 p-6 rounded-t-xl shrink-0">
              <div className="flex items-center gap-4 border-l-4 border-button-primary pl-4">
                {/* Avatar container with hover effect for photo update */}
                <div 
                  className="group relative h-14 w-14 shrink-0 rounded-xl bg-background flex items-center justify-center border border-foreground/20 overflow-hidden cursor-pointer shadow-sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {userPhoto ? (
                    <img src={userPhoto} className="h-full w-full object-cover transition-opacity group-hover:opacity-50" alt="Profile" />
                  ) : (
                    <User className="text-muted-foreground" size={28} />
                  )}
                  {/* Overlay icon visible on hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 text-white">
                    <Camera size={18} />
                  </div>
                </div>
                <div className="flex flex-col">
                  <CardTitle className="text-lg uppercase font-black tracking-tight leading-none truncate max-w-[150px] lg:max-w-none">
                    {userName}
                  </CardTitle>
                  <span className="text-[10px] text-button-primary uppercase font-bold tracking-widest mt-1">
                    Administrator Profile
                  </span>
                </div>
              </div>
              {/* Hidden file input triggered by avatar click */}
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            </CardHeader>

            <CardContent className="p-6 lg:p-8 flex flex-col flex-1 justify-between">
              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <User size={14} className="text-button-primary" /> Account Email
                  </span>
                  <p className="text-sm text-foreground break-all font-medium bg-muted/20 p-2 rounded border border-foreground/5">
                    {userEmail}
                  </p>
                </div>
              </div>

              {/* Photo Management Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6">
                <Button variant="secondary" className="flex-1 font-bold" onClick={() => fileInputRef.current?.click()}>
                  Update Photo
                </Button>
                {userPhoto && (
                  <Button variant="ghost" className="text-destructive hover:bg-destructive/10 font-bold" onClick={() => { setUserPhoto(null); localStorage.removeItem("admin_local_avatar"); }}>
                    <Trash2 size={16} className="mr-2" /> Remove
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* SECURITY & ACCESS */}
          <Card className="border-foreground bg-background text-foreground shadow-sm flex flex-col">
            <CardHeader className=" border-b border-foreground/20 p-6 rounded-t-xl shrink-0">
              <div className="flex items-center gap-4 border-l-4 border-button-primary pl-4">
                <div className="h-14 w-14 shrink-0 rounded-xl bg-background flex items-center justify-center border border-foreground/20 shadow-sm">
                  <ShieldCheck className="text-button-primary" size={28} />
                </div>
                <div className="flex flex-col">
                  <CardTitle className="text-lg uppercase font-black tracking-tight leading-none">
                    Security & Access
                  </CardTitle>
                  <span className="text-[10px] text-button-primary uppercase font-bold tracking-widest mt-1">
                    System Protection
                  </span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 lg:p-8 flex flex-col flex-1 justify-between">
              <div className="space-y-8">
                {/* Password Management Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    <Lock size={14} className="text-button-primary" /> Forget Password
                  </div>
                  {/* Reset Password Modal */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="destructive" className="w-full font-bold">Reset Admin Password</Button>
                    </DialogTrigger>
                    <DialogContent className="bg-background border-foreground">
                      <DialogHeader>
                        <DialogTitle>Confirm Password Reset</DialogTitle>
                        <DialogDescription>
                          This will send a secure reset link to <strong>{userEmail}</strong>. You will be logged out immediately.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter className="gap-2">
                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                        <Button variant="destructive" onClick={handleResetConfirm} disabled={resettingPassword}>
                          {resettingPassword ? "Sending..." : "Send Reset Email"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Third-Party Login Section (Google) */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    <LinkIcon size={14} className="text-button-primary" /> Connect Account
                  </div>
                  {googleConnected ? (
                    <div className="flex items-center justify-between p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                      <span className="text-xs font-bold text-green-600 flex items-center gap-1">
                        <Check size={14} /> LINKED TO GOOGLE
                      </span>
                      <Button variant="link" size="sm" className="text-xs font-bold h-auto p-0 text-destructive" onClick={handleDisconnectGoogle} disabled={disconnectingGoogle}>
                        Disconnect
                      </Button>
                    </div>
                  ) : (
                    <Button variant="secondary" className="w-full font-bold" onClick={handleConnectGoogle} disabled={connectingGoogle}>
                      {connectingGoogle ? "Linking..." : "Connect Google Account"}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </main>
  );
}