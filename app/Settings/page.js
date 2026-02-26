"use client";

import { useState } from "react";
import NavBarComp from "@/components/NavBarComp";
import {
  User,
  ShieldCheck,
  Save,
  Mail,
  Lock,
  KeyRound,
  PenLine,
  Palette,
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

import { toast } from "sonner";
export default function Settings() {
  const [isSaving, setIsSaving] = useState(false);
  const [resetStep, setResetStep] = useState("request");
  const [recoveryCode, setRecoveryCode] = useState("");

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 800);
  };

  const handlePasswordUpdate = () => {
    if (recoveryCode.length !== 6) {
      toast.warning("Please enter a valid 6-digit recovery code.");
      return;
    }
    // Proceed with update logic
    setResetStep("request");
    setRecoveryCode("");
  };

  return (
    <main className="flex h-dvh w-full bg-background overflow-hidden">
      <NavBarComp />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* PAGE HEADER & GLOBAL ACTIONS */}
        <header className="p-8 pb-4 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground">
              Manage administrator profile and security protocols.
            </p>
          </div>
          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-button-primary hover:bg-button-primary-foreground text-white font-bold gap-2 min-w-[140px]"
          >
            <Save size={18} />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto space-y-6 pb-8 px-8 no-scrollbar min-h-0">
          {/* ADMIN PROFILE SECTION */}
          <Card className="border-border bg-background">
            <CardHeader>
              <div className="flex items-center gap-2 text-foreground">
                <User size={20} />
                <CardTitle>Admin Profile</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6 pb-2">
                <div className="h-20 w-20 rounded-full bg-background border-2 flex items-center justify-center">
                  <User className="text-foreground" size={36} />
                </div>
                <Button
                  className="bg-button-primary hover:bg-button-primary-foreground text-white "
                  size="lg"
                >
                  Change Photo
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-foreground">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    className="border-border bg-input text-foreground placeholder:text-muted-foreground"
                    placeholder="Admin User"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input
                    className="border-border bg-input text-foreground placeholder:text-muted-foreground"
                    placeholder="admin@chiropractic.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-background">
            <CardHeader>
              <div className="flex items-center gap-2 text-foreground">
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
                  Securely update your administrative credentials using email
                  verification.
                </p>

                <Dialog
                  onOpenChange={(open) => {
                    if (!open) {
                      setResetStep("request");
                      setRecoveryCode("");
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button className="flex gap-2 bg-destructive text-white">
                      <KeyRound size={16} />
                      Reset Account Password
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Reset Password</DialogTitle>
                      <DialogDescription>
                        {resetStep === "request"
                          ? "Verify your identity via email to receive a recovery code."
                          : "Enter the 6-digit code and choose a new password."}
                      </DialogDescription>
                    </DialogHeader>

                    {resetStep === "request" ? (
                      <div className="grid gap-4 py-4">
                        <Button
                          variant="outline"
                          className="justify-start gap-4 h-16 border-blue-100 hover:bg-blue-50"
                          onClick={() => setResetStep("verify")}
                        >
                          <Mail className="text-blue-500" />
                          <div className="text-left">
                            <p className="text-sm font-bold">Email Recovery</p>
                            <p className="text-xs text-muted-foreground">
                              ad***@chiropractic.com
                            </p>
                          </div>
                        </Button>
                      </div>
                    ) : (
                      <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="code">
                            Recovery Code{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="code"
                            placeholder="000000"
                            className="text-center text-2xl tracking-[0.5em] font-mono"
                            maxLength={6}
                            value={recoveryCode}
                            onChange={(e) => setRecoveryCode(e.target.value)}
                            required
                          />
                        </div>
                        <Separator className="my-2" />
                        <div className="space-y-2">
                          <Label htmlFor="new-pass">New Password</Label>
                          <Input
                            id="new-pass"
                            type="password"
                            placeholder="••••••••"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirm-pass">
                            Confirm New Password
                          </Label>
                          <Input
                            id="confirm-pass"
                            type="password"
                            placeholder="••••••••"
                          />
                        </div>
                      </div>
                    )}

                    <DialogFooter>
                      {resetStep === "verify" ? (
                        <Button
                          className="bg-[#A0CE66] hover:bg-[#A0CE66]/80 w-full disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={handlePasswordUpdate}
                          disabled={recoveryCode.length < 6}
                        >
                          Update Password
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          className="w-full text-xs text-muted-foreground"
                        >
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
