import React, { useState } from "react";
import {
  ShieldAlert,
  Lock,
  Activity,
  Radio,
  AlertTriangle,
  Layers,
  PlayCircle,
  UserCheck,
  Users,
  Server,
  ChevronDown,
  ShieldCheck,
  User,
  Bot,
  Edit3,
  LogOut,
  KeyRound,
  Mail,
  Wifi,
  WifiOff
} from "lucide-react";
import { CurrentUserSession, NetworkStatusResponse } from "../types";

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  selectedChain: string;
  setSelectedChain: (chain: string) => void;
  onOpenSimulator: () => void;
  onQuickPause: () => void;
  blockNumber: number;
  currentUser: CurrentUserSession;
  onSwitchUserSession: (email: string) => void;
  onOpenEditAvatar?: () => void;
  onOpenResetPassword?: () => void;
  onLogout?: () => void;
  networkStatus?: NetworkStatusResponse | null;
  isLiveStreamActive?: boolean;
  onToggleLiveStream?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  selectedChain,
  setSelectedChain,
  onOpenSimulator,
  onQuickPause,
  blockNumber,
  currentUser,
  onSwitchUserSession,
  onOpenEditAvatar,
  onOpenResetPassword,
  onLogout,
  networkStatus,
  isLiveStreamActive = true,
  onToggleLiveStream,
}) => {
  const [isSessionDropdownOpen, setIsSessionDropdownOpen] = useState(false);
  const chains = ["All Chains", "Ethereum Mainnet", "Arbitrum One", "Base", "Optimism", "Polygon"];

  const ethStatus = networkStatus?.chains?.["Ethereum Mainnet"];
  const baseStatus = networkStatus?.chains?.["Base"];
  const arbStatus = networkStatus?.chains?.["Arbitrum One"];

  const tabs = [
    { id: "radar", label: "Mempool Radar", icon: Radio, badge: "Pre-Exec" },
    { id: "health", label: "Protocol Health Matrix", icon: Activity, badge: "CaR" },
    { id: "contagion", label: "Contagion Map", icon: Layers, badge: "Systemic" },
    { id: "guardian", label: "Circuit Breaker", icon: ShieldAlert, badge: "<400ms" },
    { id: "users", label: "User Monitoring", icon: Users, badge: "Live" },
    { id: "admin", label: "Admin Control Plane", icon: UserCheck, badge: currentUser.isAdmin ? "Master" : "Restricted" },
  ];

  return (
    <header className="border-b border-slate-800 bg-[#0a0e17]/95 backdrop-blur sticky top-0 z-40">
      {/* Top Banner: Main Authoritative Server Context with Live Blockchain Synchronization */}
      <div className="px-4 py-1.5 bg-slate-900/90 border-b border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            LIVE EVM RPC SYNC
          </span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="text-slate-300 font-mono-code text-[11px]">
            ETH: <span className="text-cyan-400 font-bold">#{(ethStatus?.blockNumber || blockNumber).toLocaleString()}</span> ({ethStatus?.gasPriceGwei || 0.14} Gwei)
          </span>
          <span className="hidden md:inline text-slate-600">·</span>
          <span className="hidden md:inline text-slate-300 font-mono-code text-[11px]">
            BASE: <span className="text-blue-400 font-bold">#{(baseStatus?.blockNumber || 51514670).toLocaleString()}</span>
          </span>
          <span className="hidden lg:inline text-slate-600">·</span>
          <span className="hidden lg:inline text-slate-300 font-mono-code text-[11px]">
            ARB: <span className="text-indigo-400 font-bold">#{(arbStatus?.blockNumber || 318450210).toLocaleString()}</span>
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono-code">
          {onToggleLiveStream && (
            <button
              onClick={onToggleLiveStream}
              id="btn-toggle-livestream"
              title="Toggle live 4-second on-chain RPC poller"
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                isLiveStreamActive
                  ? "bg-emerald-950/60 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900/60"
                  : "bg-amber-950/60 text-amber-300 border-amber-700/60 hover:bg-amber-900/60"
              }`}
            >
              {isLiveStreamActive ? (
                <>
                  <Wifi className="w-3 h-3 text-emerald-400 animate-pulse" />
                  <span>LIVE 4s STREAM</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-amber-400" />
                  <span>STREAM PAUSED</span>
                </>
              )}
            </button>
          )}

          <div className="hidden sm:flex items-center gap-1.5 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>RPC Latency: {ethStatus?.latencyMs || networkStatus?.p99LatencyMs || 78}ms</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 text-cyan-400 shadow-sm shadow-cyan-500/20">
            <ShieldAlert className="w-6 h-6 text-cyan-400" />
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0a0e17]"></div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-wider text-white">SENTINEL PROTOCOL</h1>
              <span className="text-[10px] font-mono-code px-1.5 py-0.5 bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 rounded">
                MAIN SERVER
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Pre-Execution Threat Radar & Protocol Health Engine
            </p>
          </div>
        </div>

        {/* Chain selector and User Controls */}
        <div className="flex items-center gap-2">
          {/* User Session Switcher / Access Badge */}
          <div className="relative">
            <button
              onClick={() => setIsSessionDropdownOpen(!isSessionDropdownOpen)}
              id="btn-session-dropdown"
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                currentUser.isAdmin
                  ? "bg-fuchsia-950/40 text-fuchsia-300 border-fuchsia-600/40 hover:bg-fuchsia-900/40"
                  : "bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800"
              }`}
              title="Click to view profile, customize bot avatar, switch accounts, or log out"
            >
              {/* Bot Avatar */}
              <div className="relative w-6 h-6 rounded-full overflow-hidden border border-cyan-400/60 bg-slate-950 shrink-0">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <span
                  className={`absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full ${
                    currentUser.isAdmin ? "bg-fuchsia-400" : "bg-emerald-400"
                  }`}
                />
              </div>
              <div className="text-left font-mono-code hidden sm:block">
                {currentUser.isAdmin ? (
                  <span className="text-fuchsia-300 text-[11px] font-bold">Admin: rajangovinda036</span>
                ) : (
                  <span className="text-slate-300 text-[11px] font-bold truncate max-w-[120px] inline-block">
                    {currentUser.name}
                  </span>
                )}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {/* Dropdown Menu to test access control & customize profile */}
            {isSessionDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2.5 z-50 text-xs animate-fade-in space-y-2">
                {/* Active Profile Header Card with Bot Avatar */}
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex items-center gap-3">
                  <div className="relative shrink-0">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-10 h-10 rounded-xl object-cover border border-cyan-500/50 bg-slate-900"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      onClick={() => {
                        setIsSessionDropdownOpen(false);
                        onOpenEditAvatar?.();
                      }}
                      title="Edit Bot Avatar"
                      className="absolute -bottom-1 -right-1 p-0.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-full cursor-pointer shadow"
                    >
                      <Edit3 className="w-2.5 h-2.5 stroke-[3]" />
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white text-xs truncate flex items-center gap-1.5">
                      <span>{currentUser.name}</span>
                      <span className="text-[8px] px-1 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded font-mono-code font-bold">
                        {currentUser.isAdmin ? "SUPER ADMIN" : "USER"}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono-code truncate">
                      {currentUser.email}
                    </div>
                  </div>
                </div>

                {/* Edit Bot Avatar Button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsSessionDropdownOpen(false);
                    onOpenEditAvatar?.();
                  }}
                  id="btn-navbar-customize-bot"
                  className="w-full py-1.5 px-2.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center gap-2 font-semibold text-xs transition-colors cursor-pointer"
                >
                  <Bot className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Customize Bot Profile Photo</span>
                </button>

                {/* Reset Password via Email Verification */}
                <button
                  type="button"
                  onClick={() => {
                    setIsSessionDropdownOpen(false);
                    onOpenResetPassword?.();
                  }}
                  id="btn-navbar-reset-password"
                  className="w-full py-1.5 px-2.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800/80 hover:border-cyan-600 flex items-center justify-center gap-2 font-semibold text-xs transition-colors cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Reset Password via Email</span>
                </button>

                <div className="pt-1 border-t border-slate-800">
                  <div className="px-1 py-1 text-[10px] uppercase font-mono-code text-slate-400 font-bold flex items-center justify-between">
                    <span>Authorized Identity</span>
                    <span className="text-cyan-400 text-[9px] font-mono-code">Sole Operator</span>
                  </div>

                  {/* Sole Authorized Super Admin */}
                  <div
                    className="w-full text-left p-2 rounded-lg flex items-start gap-2.5 mt-1 bg-cyan-950/40 border border-cyan-800/50 text-cyan-200"
                  >
                    <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <span>Govindarajan S</span>
                        <span className="text-[9px] px-1 bg-cyan-900/80 text-cyan-300 rounded font-mono-code">
                          MASTER ADMIN
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono-code">
                        rajangovinda036@gmail.com
                      </div>
                      <div className="text-[9px] text-emerald-400 mt-0.5">
                        All other user accounts deleted per directive
                      </div>
                    </div>
                  </div>
                </div>

                {/* Log Out Action in Dropdown */}
                <div className="pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSessionDropdownOpen(false);
                      onLogout?.();
                    }}
                    id="btn-navbar-logout"
                    className="w-full p-2.5 rounded-lg text-left bg-rose-950/30 hover:bg-rose-950/60 text-rose-300 border border-rose-900/60 hover:border-rose-600/80 flex items-center justify-between transition-colors cursor-pointer font-semibold text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <LogOut className="w-4 h-4 text-rose-400" />
                      <span>Log Out of Enclave</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-900/70 text-rose-200 border border-rose-700 font-mono-code">
                      Exit
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Direct Log Out Button on Header */}
          <button
            type="button"
            onClick={onLogout}
            id="btn-direct-logout"
            title={`Log Out (${currentUser.email})`}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-950/50 hover:bg-rose-900/70 text-rose-300 border border-rose-700/60 hover:border-rose-500 transition-all cursor-pointer shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span>Log Out</span>
          </button>

          {/* Chain selector */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
            <span className="text-slate-400 px-2 font-mono-code text-[11px] hidden md:inline">Chain:</span>
            <select
              value={selectedChain}
              onChange={(e) => setSelectedChain(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer pr-2 font-medium"
              id="chain-selector"
            >
              {chains.map((chain) => (
                <option key={chain} value={chain} className="bg-slate-900 text-slate-200">
                  {chain}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Exploit Simulator Trigger */}
          <button
            onClick={onOpenSimulator}
            id="btn-simulate-exploit"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 transition-colors cursor-pointer shadow-sm shadow-cyan-500/10"
          >
            <PlayCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>Simulate Exploit</span>
          </button>

          {/* Quick Guardian Pause Action */}
          <button
            onClick={onQuickPause}
            id="btn-quick-pause"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 transition-colors cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Guardian</span> Pause
          </button>
        </div>
      </div>

      {/* Tabs list */}
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 overflow-x-auto no-scrollbar border-t border-slate-800/60 pt-1 pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              id={`nav-tab-${tab.id}`}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? "bg-slate-800 text-cyan-300 border border-cyan-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-cyan-400" : "text-slate-500"}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[10px] font-mono-code px-1.5 py-0.2 rounded ${
                    isActive
                      ? "bg-cyan-950 text-cyan-300 border border-cyan-800/40"
                      : tab.id === "admin" && !currentUser.isAdmin
                      ? "bg-rose-950/80 text-rose-400 border border-rose-800/40"
                      : "bg-slate-900 text-slate-500"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};

