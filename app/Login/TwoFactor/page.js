"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
} from "firebase/auth";
import { auth } from "../Firebase/firebase";
import { getPendingMfa, clearPendingMfa } from "./mfaStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";

export default function TwoFactorPage() {
  const router = useRouter();

  const [verificationCode, setVerificationCode] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [isRecaptchaReady, setIsRecaptchaReady] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(true);

  const recaptchaRef = useRef(null);
  const mountedRef = useRef(false);
  const initStartedRef = useRef(false);

  const clearRecaptcha = () => {
    try {
      if (recaptchaRef.current) {
        recaptchaRef.current.clear();
      }
    } catch (e) {
      // ignore cleanup errors
    }

    recaptchaRef.current = null;
    initStartedRef.current = false;

    if (mountedRef.current) {
      setIsRecaptchaReady(false);
    }

    const el = document.getElementById("mfa-recaptcha-container");
    if (el) el.innerHTML = "";
  };

  const ensureRecaptcha = async ({ forceNew = false } = {}) => {
    if (forceNew) {
      clearRecaptcha();
    }

    if (recaptchaRef.current) {
      return recaptchaRef.current;
    }

    if (initStartedRef.current) {
      return null;
    }

    initStartedRef.current = true;

    try {
      const containerId = "mfa-recaptcha-container";
      const el = document.getElementById(containerId);

      if (!el) {
        initStartedRef.current = false;
        throw new Error("reCAPTCHA container not found");
      }

      el.innerHTML = "";

      const verifier = new RecaptchaVerifier(auth, containerId, {
        size: "normal",
        callback: () => {
          // solved
        },
        "expired-callback": () => {
          toast.info("reCAPTCHA expired. Please check the box again.", {
            position: "top-right",
          });
        },
      });

      await verifier.render();

      recaptchaRef.current = verifier;

      if (mountedRef.current) {
        setIsRecaptchaReady(true);
      }

      return verifier;
    } catch (err) {
      initStartedRef.current = false;
      throw err;
    }
  };

  const getMfaContext = () => {
    const pending = getPendingMfa();
    if (!pending?.resolver) return null;

    const resolver = pending.resolver;
    let hint = null;

    if (pending.selectedHintUid && Array.isArray(resolver.hints)) {
      hint =
        resolver.hints.find((h) => h?.uid === pending.selectedHintUid) || null;
    }

    if (!hint && pending.hint) hint = pending.hint;

    if (!hint && Array.isArray(resolver.hints)) {
      hint =
        resolver.hints.find(
          (h) =>
            h?.factorId === PhoneMultiFactorGenerator.FACTOR_ID && !!h?.uid,
        ) || null;
    }

    if (!hint || !resolver.session) return null;

    return { resolver, hint, pending };
  };

  const sendCode = async ({ forceNewRecaptcha = false } = {}) => {
    const ctx = getMfaContext();

    if (!ctx) {
      toast.warning("Your 2FA session expired. Please log in again.", {
        position: "top-right",
      });
      clearPendingMfa();
      router.replace("/Login");
      return;
    }

    setIsSendingCode(true);

    try {
      const { resolver, hint } = ctx;
      setMaskedPhone(hint.phoneNumber || "your phone");
      setShowCaptcha(true);

      const verifier = await ensureRecaptcha({ forceNew: forceNewRecaptcha });

      if (!verifier) {
        toast.warning("reCAPTCHA is still loading. Please try again.", {
          position: "top-right",
        });
        return;
      }

      const phoneInfoOptions = {
        multiFactorUid: hint.uid,
        session: resolver.session,
      };

      const provider = new PhoneAuthProvider(auth);

      const newVerificationId = await provider.verifyPhoneNumber(
        phoneInfoOptions,
        verifier,
      );

      if (!mountedRef.current) return;

      setVerificationId(newVerificationId);

      clearRecaptcha();
      setShowCaptcha(false);

      toast.success("Verification code sent by text message.", {
        position: "top-right",
      });
    } catch (err) {
      console.error("MFA sendCode error:", err);
      console.error("code:", err?.code);
      console.error("message:", err?.message);

      clearRecaptcha();
      setShowCaptcha(true);

      if (err?.code === "auth/invalid-multi-factor-session") {
        toast.warning("2FA session expired. Please log in again.", {
          position: "top-right",
        });
        clearPendingMfa();
        router.replace("/Login");
        return;
      }

      if (err?.code === "auth/captcha-check-failed") {
        toast.warning(
          "reCAPTCHA validation failed. Please check the box again and click Send Code right away.",
          { position: "top-right" },
        );
        return;
      }

      if (err?.code === "auth/invalid-app-credential") {
        toast.warning(
          "The reCAPTCHA token was invalid or expired. Please check the box again, then click Send Code.",
          { position: "top-right" },
        );
        return;
      }

      if (err?.code === "auth/network-request-failed") {
        toast.warning(
          "Network request failed. Turn off ad blockers or VPN and try again.",
          { position: "top-right" },
        );
        return;
      }

      toast.warning(
        `Could not send 2FA code (${err?.code || "unknown"}). Please try again.`,
        { position: "top-right" },
      );
    } finally {
      if (mountedRef.current) {
        setIsSendingCode(false);
      }
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();

    const ctx = getMfaContext();

    if (!ctx || !verificationId) {
      toast.warning("Your 2FA session expired. Please log in again.", {
        position: "top-right",
      });
      clearPendingMfa();
      router.replace("/Login");
      return;
    }

    if (!verificationCode.trim()) {
      toast.warning("Enter the 6-digit code from your text message.", {
        position: "top-right",
      });
      return;
    }

    setIsVerifyingCode(true);

    try {
      const cred = PhoneAuthProvider.credential(
        verificationId,
        verificationCode.trim(),
      );

      const assertion = PhoneMultiFactorGenerator.assertion(cred);

      await ctx.resolver.resolveSignIn(assertion);

      const redirectTo = ctx.pending?.postMfaRedirect || "/";

      clearPendingMfa();
      clearRecaptcha();

      toast.success("2FA verified. Welcome!", { position: "top-right" });
      router.push(redirectTo);
    } catch (err) {
      console.error("MFA verify error:", err);
      toast.warning("Invalid or expired code. Please try again.", {
        position: "top-right",
      });
    } finally {
      if (mountedRef.current) {
        setIsVerifyingCode(false);
      }
    }
  };

  const handleResendCode = async () => {
    setShowCaptcha(true);
    await sendCode({ forceNewRecaptcha: true });
  };

  const handleCancel = () => {
    clearPendingMfa();
    clearRecaptcha();
    router.replace("/Login");
  };

  useEffect(() => {
    mountedRef.current = true;

    const ctx = getMfaContext();
    if (!ctx) {
      toast.warning("Your 2FA session expired. Please log in again.", {
        position: "top-right",
      });
      router.replace("/Login");

      return () => {
        mountedRef.current = false;
      };
    }

    setMaskedPhone(ctx.hint.phoneNumber || "your phone");

    ensureRecaptcha().catch((err) => {
      console.error("reCAPTCHA init error:", err);
      toast.warning("Could not load reCAPTCHA. Refresh and try again.", {
        position: "top-right",
      });
    });

    return () => {
      mountedRef.current = false;
      clearRecaptcha();
    };
  }, []);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-sidebar">
      <div className="flex flex-col items-center gap-4 bg-background rounded-lg p-4 w-1/3">
        <p className="text-center text-foreground text-2xl font-bold">
          Two-Factor Verification
        </p>
        {verificationId ? (
          <div>
            <p className="text-center text-sm text-foreground p-4">
              Enter the code sent to {maskedPhone || "your phone"}.
            </p>
            <form
              className="flex flex-col gap-4 w-full"
              onSubmit={handleVerifyCode}
            >
              <Input
                className="bg-slate-50"
                type="text"
                placeholder="6-digit code"
                inputMode="numeric"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                disabled={!verificationId}
              />

              <Button
                variant="secondary"
                type="submit"
                disabled={isSendingCode || isVerifyingCode || !verificationId}
              >
                {isVerifyingCode ? "Verifying..." : "Verify Code"}
              </Button>

              <Button
                type="button"
                variant="third"
                onClick={handleResendCode}
                disabled={isSendingCode || isVerifyingCode}
              >
                {isSendingCode ? "Sending..." : "Resend Code"}
              </Button>
            </form>
          </div>
        ) : (
          <div>
            <p className="text-center text-sm text-foreground p-4">
              Complete reCAPTCHA, then click &quot;Send Code&quot; for
              {maskedPhone || "your phone"}.
            </p>
            <div
              id="mfa-recaptcha-container"
              className={`w-full justify-center rounded-2xl pb-4 ${showCaptcha ? "flex" : "hidden"}`}
            />
            <Button
              className="w-full"
              type="button"
              variant="secondary"
              onClick={() => sendCode()}
              disabled={!isRecaptchaReady || isSendingCode}
            >
              {isSendingCode ? "Sending..." : "Send Code"}
            </Button>
          </div>
        )}
        <button
          type="button"
          className="cursor-pointer"
          onClick={handleCancel}
          disabled={isVerifyingCode}
        >
          Back to Login
        </button>
        <p className="text-xs text-muted-foreground text-center">
          If this page is refreshed, your 2FA session may expire and you may
          need to log in again.
        </p>
      </div>
    </main>
  );
}
