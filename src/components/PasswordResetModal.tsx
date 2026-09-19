import React, { useState, useEffect } from "react";
import {
  Mail,
  KeyRound,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  X,
  Send,
  Lock,
  Eye,
  EyeOff,
  Timer,
  RefreshCw,
  ArrowRight
} from "lucide-react";

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  authorizedEmail: string;
  onPasswordResetSuccess: (newPassword: string) => void;
}

export const PasswordResetModal: React.FC<PasswordResetModalProps> = ({
  isOpen,
  onClose,
  authorizedEmail,
  onPasswordResetSuccess
}) => {
  const [step, setStep] = useState<"request" | "verify_and_set" | "success">("request");
  const [emailInput, setEmailInput] = useState<string>(authorizedEmail);
  const [otpCode, setOtpCode] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Email dispatch status & countdown timer
  const [codeExpiresAt, setCodeExpiresAt] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(600); // 10 minutes in seconds

  // Keep email input synchronized with authorized email
  useEffect(() => {
    if (authorizedEmail) {
      setEmailInput(authorizedEmail);
    }
  }, [authorizedEmail]);

  // Expiration countdown timer
  useEffect(() => {
    if (!codeExpiresAt || step !== "verify_and_set") return;

    const interval = setInterval(() => {
      const now = Date.now();
      const secLeft = Math.max(0, Math.ceil((codeExpiresAt - now) / 1000));
      setRemainingTime(secLeft);
      if (secLeft <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [codeExpiresAt, step]);

  if (!isOpen) return null;

  // Step 1: Request 6-digit verification code sent to email
  const handleRequestCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/auth/request-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput.trim() })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to dispatch verification code.");
      }

      // STRICT PRIVACY: The code is sent to the user's email only and NEVER stored or shown on the client UI
      setCodeExpiresAt(data.expiresAt);
      setRemainingTime(data.expiresInMinutes ? data.expiresInMinutes * 60 : 600);
      setStep("verify_and_set");
      setSuccessMessage(data.message || `Verification code sent to your email address (${emailInput}).`);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error requesting reset code");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify code and update password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanCode = otpCode.trim();
    const cleanPassword = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanCode) {
      setErrorMessage("Please enter the 6-digit verification code received in your email inbox.");
      return;
    }

    if (cleanCode.length !== 6) {
      setErrorMessage("Verification code must be exactly 6 digits.");
      return;
    }

    if (!cleanPassword) {
      setErrorMessage("Please enter your new master password.");
      return;
    }

    if (cleanPassword.length < 6) {
      setErrorMessage("Password must contain at least 6 characters.");
      return;
    }

    if (cleanPassword !== cleanConfirm) {
      setErrorMessage("Passwords do not match. Please verify both fields.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailInput.trim(),
          code: cleanCode,
          newPassword: cleanPassword
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Password reset failed. Check your verification code.");
      }

      setStep("success");
      onPasswordResetSuccess(cleanPassword);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Password reset failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Password strength helper
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, text: "None", color: "bg-slate-800 text-slate-500" };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, text: "Weak", color: "bg-rose-500 text-rose-300" };
    if (score <= 2) return { score: 2, text: "Medium", color: "bg-amber-500 text-amber-300" };
    if (score <= 3) return { score: 3, text: "Good", color: "bg-cyan-500 text-cyan-300" };
    return { score: 4, text: "Strong", color: "bg-emerald-500 text-emerald-300" };
  };

  const passStrength = getPasswordStrength(newPassword);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      id="password-reset-modal-backdrop"
    >
      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-200 relative"
        id="password-reset-modal-card"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide uppercase font-mono-code">
                Reset Master Enclave Password
              </h2>
              <p className="text-xs text-slate-400">
                Email Address Identity Verification Protocol
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close modal"
            id="btn-close-reset-modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: REQUEST VERIFICATION CODE */}
          {step === "request" && (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-semibold">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Sole Identity Security Guarantee</span>
                </div>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  To prevent unauthorized takeovers, password resets require cryptographic 6-digit email confirmation dispatched strictly to the registered operator address.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target Operator Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={emailInput}
                    readOnly
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono-code text-cyan-300 cursor-not-allowed opacity-90"
                    id="input-reset-email"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1 font-mono-code">
                  Restricted to sole admin: {authorizedEmail}
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  id="btn-request-reset-code"
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Dispatching Verification Token...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send 6-Digit Verification Code to Email</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: ENTER OTP CODE & SET NEW PASSWORD */}
          {step === "verify_and_set" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {/* Confidential Email Dispatch Notice */}
              <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-cyan-300 font-semibold font-mono-code text-xs">
                    <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Dispatched to {emailInput}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-mono-code text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60">
                    <Timer className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>Expires: <strong>{formatTime(remainingTime)}</strong></span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/90 border border-slate-800 text-[11px] text-slate-300 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>Confidential Information Protection</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    A 6-digit verification code has been dispatched directly to your personal email address (<strong>{emailInput}</strong>).
                  </p>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    🔒 <strong className="text-slate-200">Never displayed on open screens:</strong> Because this code grants administrative enclave access, it is kept private. Please open your email inbox, check the incoming message from Sentinel Security, and enter the code below.
                  </p>
                </div>
              </div>

              {/* OTP Input Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  6-Digit Verification Code
                </label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter 6-digit code..."
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm font-mono-code tracking-widest text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                    id="input-reset-otp"
                  />
                </div>
              </div>

              {/* New Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    New Master Enclave Password
                  </label>
                  {newPassword && (
                    <span className="text-[10px] font-mono-code text-slate-400">
                      Strength: <strong className={passStrength.color}>{passStrength.text}</strong>
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new strong password..."
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono-code text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                    id="input-reset-new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Confirm New Master Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password..."
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono-code text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                    id="input-reset-confirm-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleRequestCode}
                  disabled={isLoading}
                  className="text-xs font-mono-code text-slate-400 hover:text-cyan-400 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                  <span>Resend Code</span>
                </button>

                <button
                  type="submit"
                  disabled={isLoading}
                  id="btn-submit-new-password"
                  className="py-2.5 px-5 rounded-xl font-bold text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Updating Enclave Vault...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verify & Reset Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: SUCCESS STATE */}
          {step === "success" && (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Password Reset Successful</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Your Master Enclave password has been updated and any temporary security lockouts have been released.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono-code flex items-center justify-between">
                <span className="text-slate-400">Enclave Vault Status:</span>
                <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Password Securely Updated</span>
                </span>
              </div>

              <div className="pt-2">
                <button
                  onClick={onClose}
                  id="btn-return-to-login"
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Proceed to Enclave Login</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
