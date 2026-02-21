"use client";

import { useState } from "react";
import NavBarComp from "@/components/NavBarComp";
import { 
  User, 
  ShieldCheck, 
  Save, 
  Mail, 
  Lock,
  Smartphone,
  KeyRound
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

export default function Settings() {
  const [isSaving, setIsSaving] = useState(false);
  const [resetStep, setResetStep] = useState("request"); 

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 800);
  };

  return (
    <main className="flex min-h-dvh w-full bg-slate-50/50">
      <NavBarComp />
      
      <div className="flex-1 p-8">
        {/* PAGE HEADER & GLOBAL ACTIONS */}
        <header className="pb-8 px-4 flex justify-between items-end max-w-4xl mx-auto">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
            <p className="text-gray-500">Manage administrator profile and security protocols.</p>
          </div>
          {/* Save Button */}
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-[#002D58] hover:bg-[#002D58]/90 text-white font-bold gap-2 min-w-[140px]"
          >
            <Save size={18} />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </header>

        <div className="max-w-4xl mx-auto space-y-6 px-4">
          
          {/* ADMIN PROFILE SECTION */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-[#002D58]">
                <User size={20} />
                <CardTitle>Admin Profile</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Upload */}
              <div className="flex items-center gap-6 pb-2">
                <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="text-[#002D58]" size={36} />
                </div>
                <Button className="bg-[#7AC242] hover:bg-[#7AC242]/90 text-white " variant="outline" size="lg">
                  Change Photo
                </Button>
              </div>

              {/* Form inputs for basic account details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input defaultValue="Admin User" />
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input defaultValue="admin@chiropractic.com" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECURITY & ACCESS SECTION */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-[#002D58]">
                <ShieldCheck size={20} />
                <CardTitle>Security & Access</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                   <Lock size={16} className="text-muted-foreground" />
                   <p>Password Management</p>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Securely update your administrative credentials using multi-channel verification.
                </p>

                {/* PASSWORD RESET DIALOG */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="flex gap-2 bg-red-500 hover:bg-red-600 text-white border-none" variant="outline">
                      <KeyRound size={16} />
                      Reset Account Password
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Reset Password</DialogTitle>
                      <DialogDescription>
                        {resetStep === "request" 
                          ? "Select a method to receive your recovery code." 
                          : "Enter the 6-digit code and choose a new password."}
                      </DialogDescription>
                    </DialogHeader>

                    {/*  Select Verification Method */}
                    {resetStep === "request" ? (
                      <div className="grid gap-4 py-4">
                        <Button 
                          variant="outline" 
                          className="justify-start gap-4 h-16" 
                          onClick={() => setResetStep("verify")}
                        >
                          <Mail className="text-blue-500" />
                          <div className="text-left">
                            <p className="text-sm font-bold">Email Recovery</p>
                            <p className="text-xs text-muted-foreground">ad***@chiropractic.com</p>
                          </div>
                        </Button>
                        <Button 
                          variant="outline" 
                          className="justify-start gap-4 h-16"
                          onClick={() => setResetStep("verify")}
                        >
                          <Smartphone className="text-green-500" />
                          <div className="text-left">
                            <p className="text-sm font-bold">SMS Recovery</p>
                            <p className="text-xs text-muted-foreground">***-***-9999</p>
                          </div>
                        </Button>
                      </div>
                    ) : (
                      /* Input Recovery Code & New Credentials */
                      <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="code">Recovery Code</Label>
                          <Input id="code" placeholder="000000" className="text-center text-2xl tracking-[0.5em] font-mono" maxLength={6} />
                        </div>
                        <Separator className="my-2" />
                        <div className="space-y-2">
                          <Label htmlFor="new-pass">New Password</Label>
                          <Input id="new-pass" type="password" placeholder="••••••••" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirm-pass">Confirm New Password</Label>
                          <Input id="confirm-pass" type="password" placeholder="••••••••" />
                        </div>
                      </div>
                    )}

                    {/* FOOTER ACTIONS based on current reset step */}
                    <DialogFooter>
                      {resetStep === "verify" ? (
                        <Button className="bg-[#A0CE66] hover:bg-[#A0CE66]/80 w-full" onClick={() => setResetStep("request")}>
                          Update Password
                        </Button>
                      ) : (
                        <Button variant="ghost" className="w-full text-xs text-muted-foreground">
                          Contact System Support
                        </Button>
                      )}
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}