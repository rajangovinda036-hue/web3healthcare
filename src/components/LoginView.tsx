import React, { useState, useEffect } from "react";
import {
  Shield,
  Lock,
  Bot,
  KeyRound,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Zap,
  Users,
  Eye,
  EyeOff,
  AlertCircle,
  AlertTriangle,
  Radio,
  Edit3,
  Timer,
  Clock,
  Mail,
  ShieldCheck
} from "lucide-react";
import { CurrentUserSession } from "../types";
import { EditBotAvatarModal } from "./EditBotAvatarModal";
import { PasswordResetModal } from "./PasswordResetModal";

interface LoginViewProps {
  onLoginSuccess: (user: CurrentUserSession) => void;
}

const AUTHORIZED_ADMIN_EMAIL = "rajangovinda036@gmail.com";
const FIXED_MASTER_PASSWORD = "Govinda@036";

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [adminEmail] = useState<string>(AUTHORIZED_ADMIN_EMAIL);
  const [adminPasscode, setAdminPasscode] = useState<string>("");
  const [currentMasterPassword, setCurrentMasterPassword] = useState<string>(FIXED_MASTER_PASSWORD);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Security Lockout & Attempt Tracking State
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [isLockedOut, setIsLockedOut] = useState<boolean>(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);

  // Bot Avatar State
  const [adminBotAvatar, setAdminBotAvatar] = useState<string>(
    "https://api.dicebear.com/7.x/bottts/svg?seed=GovindaSentinel&backgroundColor=0284c7"
  );

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);
  const [modalTargetUser, setModalTargetUser] = useState<CurrentUserSession | null>(null);

  // Check initial security lockout status from server
  useEffect(() => {
    let isMounted = true;
    const checkLockout = async () => {
      try {
        const res = await fetch("/api/auth/lockout-status");
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            if (data.currentMasterPassword) {
              setCurrentMasterPassword(data.currentMasterPassword);
            }
            if (data.isLockedOut && data.remainingSeconds > 0) {
              setIsLockedOut(true);
              setRemainingSeconds(data.remainingSeconds);
              setFailedAttempts(data.failedAttempts || 3);
            } else {
              setIsLockedOut(false);
              setRemainingSeconds(0);
              setFailedAttempts(data.failedAttempts || 0);
            }
          }
        }
      } catch (e) {
        console.warn("Could not check lockout status:", e);
      }
    };
    checkLockout();
    return () => {
      isMounted = false;
    };
  }, []);

  // Live 1-second countdown ticker when locked out
  useEffect(() => {
    if (!isLockedOut || remainingSeconds <= 0) return;

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          setIsLockedOut(false);
          setFailedAttempts(0);
          setErrorMessage(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isLockedOut, remainingSeconds]);

  const formatRemainingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePasswordResetSuccess = (newPassword: string) => {
    setCurrentMasterPassword(newPassword);
    setAdminPasscode(newPassword);
    setIsLockedOut(false);
    setFailedAttempts(0);
    setRemainingSeconds(0);
    setErrorMessage(null);
  };

  const handleOpenEditAvatar = () => {
    setModalTargetUser({
      email: adminEmail,
      name: "Govindarajan S",
      role: "SUPER_ADMIN",
      isAdmin: true,
      avatar: adminBotAvatar,
      walletAddress: "0x9e4F2b318Da90117bBc981A721590F8e312A12dA"
    });
    setIsEditModalOpen(true);
  };

  const handleAvatarUpdated = (updatedUser: CurrentUserSession) => {
    if (updatedUser.isAdmin) {
      setAdminBotAvatar(updatedUser.avatar);
    }
  };

  const executeLogin = async (
    targetEmail: string,
    targetPasscode: string,
    targetName: string,
    targetRole: string,
    targetAvatar: string
  ) => {
    if (isLockedOut) {
      setErrorMessage(`Access Blocked: Account locked for 5 minutes. Try again in ${formatRemainingTime(remainingSeconds)}.`);
      return;
    }

    if (!targetPasscode || !targetPasscode.trim()) {
      setErrorMessage("Please enter the cryptographic master password.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (targetEmail.toLowerCase() !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
        throw new Error("Access Denied: All other users have been deleted. Only rajangovinda036@gmail.com is authorized.");
      }

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: targetEmail,
          password: targetPasscode,
          name: targetName,
          role: targetRole,
          avatar: targetAvatar
        })
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        // Handle 5-minute lockout response
        if (data.isLockedOut) {
          setIsLockedOut(true);
          setFailedAttempts(3);
          setRemainingSeconds(data.remainingSeconds || 300);
          throw new Error(data.error || "Wrong password entered 3 times! Account blocked for 5 minutes.");
        }

        // Handle attempt warning before lockout
        if (data.failedAttempts !== undefined) {
          setFailedAttempts(data.failedAttempts);
        }

        throw new Error(data.error || "Authentication failed. Check credentials.");
      }

      if (data?.user) {
        setFailedAttempts(0);
        setIsLockedOut(false);
        const session: CurrentUserSession = {
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
          isAdmin: data.user.isAdmin,
          walletAddress: data.user.walletAddress,
          avatar: data.user.avatar || targetAvatar,
          loginTime: data.user.loginTime || new Date().toISOString()
        };
        // Persist session
        localStorage.setItem("sentinel_session", JSON.stringify(session));
        onLoginSuccess(session);
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      setErrorMessage(err.message || "Failed to establish authenticated enclave session.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeLogin(adminEmail, adminPasscode, "Govindarajan S", "SUPER_ADMIN", adminBotAvatar);
  };

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Background Decorative Tech Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar */}
      <header className="px-6 py-4 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-md shadow-cyan-500/10">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-white tracking-wide text-sm flex items-center gap-2">
              <span>SENTINEL PROTOCOL</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono-code bg-cyan-950 text-cyan-300 border border-cyan-800">
                MASTER NODE
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono-code">
              Autonomous Enclave Gateway · High-Throughput Mempool Guard
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono-code text-slate-400">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>Node #SG-01 Online</span>
          <span className="text-slate-600">|</span>
          <span className="text-cyan-400">Sole Operator Active</span>
        </div>
      </header>

      {/* Main Login Card Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10 my-6">
        <div
          id="login-terminal-container"
          className="w-full max-w-xl bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden"
        >
          {/* Subtle Accent Glow */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-cyan-400" />

          {/* Gateway Title */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono-code font-bold bg-cyan-950/70 text-cyan-300 border border-cyan-800/80 mb-3">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Restricted Master Console</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Enclave Security Gateway
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
              Single-Operator Enclave Active: All users except <span className="text-cyan-300 font-mono-code">rajangovinda036@gmail.com</span> have been deleted.
            </p>
          </div>

          {/* Exclusive Operator Notice Banner */}
          <div className="mb-4 p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between text-xs text-cyan-200">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                <strong className="font-semibold text-white">Single-User Policy Enforced:</strong> Only the Lead System Administrator can authenticate.
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-900/60 text-cyan-300 border border-cyan-700 font-mono-code shrink-0">
              1 USER SYSTEM
            </span>
          </div>

          {/* ACTIVE 5-MINUTE SECURITY LOCKOUT BANNER */}
          {isLockedOut && (
            <div
              id="lockout-alert-banner"
              className="mb-5 p-4 rounded-xl bg-rose-950/90 border-2 border-rose-500 text-rose-200 shadow-xl shadow-rose-950/60"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-400 animate-bounce" />
                  <span className="font-bold text-sm text-white">SECURITY LOCKOUT ACTIVATED</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono-code bg-rose-900 border border-rose-700 text-rose-100 font-bold">
                  BLOCKED 5 MIN
                </span>
              </div>
              <p className="text-xs text-rose-300 mb-3 leading-relaxed">
                You entered the wrong password <strong>3 consecutive times</strong>. Access to the master enclave has been blocked for 5 minutes to protect the protocol.
              </p>
              <div className="bg-slate-950/80 rounded-lg p-3 border border-rose-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono-code text-slate-300">
                  <Timer className="w-4 h-4 text-rose-400 animate-spin" />
                  <span>Cooldown Countdown:</span>
                </div>
                <div className="text-2xl font-bold font-mono-code text-rose-400 tracking-wider">
                  {formatRemainingTime(remainingSeconds)}
                </div>
              </div>
              <div className="text-[11px] text-rose-300/80 mt-2 font-mono-code">
                Lockout will automatically release once the timer expires.
              </div>
              <div className="mt-3 pt-2.5 border-t border-rose-800/80 flex items-center justify-between flex-wrap gap-2">
                <span className="text-[11px] text-rose-300">Need immediate access or forgot password?</span>
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(true)}
                  id="btn-lockout-reset-password"
                  className="px-2.5 py-1 rounded bg-rose-900/90 hover:bg-rose-800 text-white text-[11px] font-mono-code flex items-center gap-1.5 cursor-pointer border border-rose-600 transition-colors shadow-sm"
                >
                  <Mail className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Reset via Email Verification</span>
                </button>
              </div>
            </div>
          )}

          {/* FAILED ATTEMPTS WARNING BANNER (When < 3 failed attempts) */}
          {!isLockedOut && failedAttempts > 0 && (
            <div
              id="attempts-warning-banner"
              className="mb-4 p-3 rounded-xl bg-amber-950/60 border border-amber-500/60 text-amber-200 text-xs flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Failed Password Attempts:</strong> {failedAttempts} of 3 used.
                </span>
              </div>
              <span className="font-mono-code font-bold text-amber-300 px-2 py-0.5 rounded bg-amber-900/60 border border-amber-700 text-[11px]">
                {3 - failedAttempts} attempt{3 - failedAttempts === 1 ? "" : "s"} before 5m block
              </span>
            </div>
          )}

          {/* Standard Error Message Display */}
          {errorMessage && !isLockedOut && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* SECURE ENCLAVE ACCESS STATUS CARD */}
          <div className="mb-5 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <ShieldCheck className="w-4 h-4 shrink-0" />
              </div>
              <div>
                <div className="text-slate-200 font-semibold font-mono-code text-[11px]">Enclave Access Protection</div>
                <div className="text-slate-500 text-[10px]">Confidential operator authentication · rajangovinda036@gmail.com</div>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(true)}
                id="btn-reference-reset-password"
                className="px-2.5 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800/80 hover:border-cyan-600 text-[11px] font-mono-code flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Reset password via confidential email verification"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Reset via Email</span>
              </button>
            </div>
          </div>

          {/* ADMIN MASTER NODE LOGIN FORM */}
          <form onSubmit={handleAdminSubmit} className="space-y-4">
            {/* Bot Profile Card Preview with Edit Action */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
              <div className="relative shrink-0">
                <div className="w-16 h-16 rounded-xl bg-slate-900 border-2 border-cyan-400/60 overflow-hidden shadow-lg shadow-cyan-500/10 p-0.5">
                  <img
                    src={adminBotAvatar}
                    alt="Govindarajan S Bot Avatar"
                    className="w-full h-full object-cover rounded-lg"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleOpenEditAvatar}
                  id="btn-edit-admin-avatar-login"
                  title="Change Bot Photo"
                  className="absolute -bottom-1 -right-1 p-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-full shadow cursor-pointer transition-transform hover:scale-110"
                >
                  <Edit3 className="w-3 h-3 stroke-[2.5]" />
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white text-sm">Govindarajan S</span>
                  <span className="text-[9px] px-1.5 py-0.5 bg-fuchsia-950 text-fuchsia-300 border border-fuchsia-800 rounded font-mono-code font-bold">
                    SUPER ADMIN
                  </span>
                </div>
                <div className="text-xs text-cyan-300 font-mono-code truncate mt-0.5">
                  rajangovinda036@gmail.com
                </div>
                <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Sole Authorized Identity
                  </span>
                  <button
                    type="button"
                    onClick={handleOpenEditAvatar}
                    className="text-cyan-400 hover:underline font-medium cursor-pointer"
                  >
                    Edit Bot Photo
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Authorized Admin Email Address
              </label>
              <input
                type="email"
                value={adminEmail}
                readOnly
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono-code text-cyan-300 cursor-not-allowed opacity-90"
                id="input-admin-email"
              />
              <p className="text-[10px] text-slate-500 mt-1 font-mono-code">
                Access is restricted strictly to rajangovinda036@gmail.com. All other accounts have been deleted.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Cryptographic Enclave Key / Password
                </label>
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(true)}
                  id="btn-inline-forgot-password-link"
                  className="text-[10px] font-mono-code text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Mail className="w-3 h-3" />
                  <span>Forgot Password?</span>
                </button>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={adminPasscode}
                  disabled={isLockedOut || isLoading}
                  onChange={(e) => setAdminPasscode(e.target.value)}
                  placeholder="Enter your master password..."
                  className="w-full pl-9 pr-10 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono-code text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 disabled:opacity-50 disabled:cursor-not-allowed"
                  id="input-admin-passcode"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex items-center justify-between text-[11px] mt-1.5 font-mono-code flex-wrap gap-1">
                <p className="text-[10px] text-slate-500">
                  Security Policy: 3 wrong attempts triggers a 5-minute security block.
                </p>
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(true)}
                  id="btn-inline-reset-password"
                  className="text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 cursor-pointer text-[10px]"
                >
                  <Mail className="w-3 h-3" />
                  <span>Reset via Email</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || isLockedOut}
              id="btn-login-admin-submit"
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLockedOut ? (
                <>
                  <Timer className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Account Blocked ({formatRemainingTime(remainingSeconds)})</span>
                </>
              ) : isLoading ? (
                <span>Verifying Enclave Handshake...</span>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Authenticate Master Admin Enclave</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Instant 1-Click Action */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <div className="text-[11px] font-mono-code text-slate-400 mb-2 flex items-center justify-between">
              <span>Quick Authentication:</span>
              <span className="text-cyan-400 text-[10px] font-mono-code">1-click direct entry</span>
            </div>
            <div>
              <button
                type="button"
                disabled={isLockedOut}
                onClick={() =>
                  executeLogin(
                    AUTHORIZED_ADMIN_EMAIL,
                    currentMasterPassword,
                    "Govindarajan S",
                    "SUPER_ADMIN",
                    adminBotAvatar
                  )
                }
                className="w-full p-2.5 rounded-xl bg-slate-950/80 hover:bg-cyan-950/50 border border-slate-800 hover:border-cyan-500/40 text-left transition-colors cursor-pointer text-xs flex items-center justify-between disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 overflow-hidden shrink-0">
                    <img
                      src={adminBotAvatar}
                      alt="Govindarajan S"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      <span>Govindarajan S</span>
                      <span className="text-[8px] px-1 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded font-mono-code">
                        SUPER ADMIN
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono-code">
                      rajangovinda036@gmail.com
                    </div>
                  </div>
                </div>
                <div className="text-cyan-400 font-mono-code text-[11px] flex items-center gap-1 font-semibold">
                  <span>{isLockedOut ? "Blocked" : "Sign In with Master Key"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>
            </div>
          </div>

          {/* Privacy & Anti-Fake Enforcement Notice */}
          <div className="mt-5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2">
            <EyeOff className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-300">Strict Identity Enforcement:</span>{" "}
              All external users and mock operators have been deleted from storage and telemetry. Only the primary administrator session is maintained.
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-3 border-t border-slate-800/80 bg-slate-950/80 text-center text-xs text-slate-500 font-mono-code">
        Sentinel Protocol · Authoritative Main Server Gateway · Non-Custodial Enclave Security
      </footer>

      {/* Editable Bot Avatar Modal */}
      {modalTargetUser && (
        <EditBotAvatarModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          currentUser={modalTargetUser}
          onUpdateUser={handleAvatarUpdated}
        />
      )}

      {/* Email Verification Password Reset Modal */}
      <PasswordResetModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        authorizedEmail={AUTHORIZED_ADMIN_EMAIL}
        onPasswordResetSuccess={handlePasswordResetSuccess}
      />
    </div>
  );
};
