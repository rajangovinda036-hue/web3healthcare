import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "./components/Navbar";
import { MempoolRadar } from "./components/MempoolRadar";
import { ProtocolHealthMatrix } from "./components/ProtocolHealthMatrix";
import { ContagionGraphView } from "./components/ContagionGraphView";
import { CircuitBreakerView } from "./components/CircuitBreakerView";
import { AdminActivitiesView } from "./components/AdminActivitiesView";
import { UserMonitoringView } from "./components/UserMonitoringView";
import { ExploitSimulatorModal } from "./components/ExploitSimulatorModal";
import { AiAnalystModal } from "./components/AiAnalystModal";
import { ProtocolDetailModal } from "./components/ProtocolDetailModal";
import { LoginView } from "./components/LoginView";
import { EditBotAvatarModal } from "./components/EditBotAvatarModal";
import { PasswordResetModal } from "./components/PasswordResetModal";
import { ThreatEvent, ProtocolHealth, ContagionGraphData, CircuitBreakerLog, AIAnalysisResult, CurrentUserSession, NetworkStatusResponse } from "./types";
import { AlertTriangle, CheckCircle2, ShieldAlert, X } from "lucide-react";
import confetti from "canvas-confetti";

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>("radar");
  const [selectedChain, setSelectedChain] = useState<string>("All Chains");
  const [blockNumber, setBlockNumber] = useState<number>(26011380);
  const [networkStatus, setNetworkStatus] = useState<NetworkStatusResponse | null>(null);
  const [isLiveStreamActive, setIsLiveStreamActive] = useState<boolean>(true);

  // Active user session state (gated: strictly only rajangovinda036@gmail.com is permitted)
  const [currentUser, setCurrentUser] = useState<CurrentUserSession | null>(() => {
    try {
      const saved = localStorage.getItem("sentinel_session");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email?.toLowerCase() === "rajangovinda036@gmail.com") {
          return parsed;
        } else {
          // Discard any non-admin saved session immediately
          localStorage.removeItem("sentinel_session");
        }
      }
    } catch (e) {
      console.warn("Could not read stored session", e);
    }
    return null;
  });

  const [isEditAvatarModalOpen, setIsEditAvatarModalOpen] = useState<boolean>(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState<boolean>(false);

  const [threats, setThreats] = useState<ThreatEvent[]>([]);
  const [protocols, setProtocols] = useState<ProtocolHealth[]>([]);
  const [contagionData, setContagionData] = useState<ContagionGraphData>({ nodes: [], edges: [] });
  const [circuitBreakerLogs, setCircuitBreakerLogs] = useState<CircuitBreakerLog[]>([]);

  // Modals & Drawers
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [selectedProtocolDetail, setSelectedProtocolDetail] = useState<ProtocolHealth | null>(null);

  // AI Analyst state
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [aiTargetThreat, setAiTargetThreat] = useState<ThreatEvent | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // Notification Banner
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "alert" } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const showToast = useCallback((text: string, type: "success" | "alert" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  }, []);

  // Handle successful login
  const handleLoginSuccess = (user: CurrentUserSession) => {
    setCurrentUser(user);
    localStorage.setItem("sentinel_session", JSON.stringify(user));
    showToast(
      user.isAdmin
        ? `Access Granted: Authoritative Admin (${user.email})`
        : `Access Granted: Operator (${user.name})`,
      "success"
    );
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
  };

  // Handle logging out and returning to login gate
  const handleLogout = async () => {
    if (currentUser) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: currentUser.email })
        });
      } catch (err) {
        console.error("Logout request error:", err);
      }
    }
    localStorage.removeItem("sentinel_session");
    setCurrentUser(null);
    showToast("Session disconnected. Security gate locked.", "alert");
  };

  // Handle switching active user session
  const handleSwitchSession = async (email: string) => {
    try {
      const cleanEmail = email.toLowerCase().trim();
      const isAdmin = cleanEmail === "rajangovinda036@gmail.com";
      if (!isAdmin) {
        showToast("Access Denied: All other users have been deleted. Only rajangovinda036@gmail.com is authorized.", "alert");
        return;
      }

      const botAvatar = currentUser?.isAdmin && currentUser.avatar
        ? currentUser.avatar
        : "https://api.dicebear.com/7.x/bottts/svg?seed=GovindaSentinel&backgroundColor=0284c7";

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          password: "Govinda@036",
          name: "Govindarajan S",
          role: "SUPER_ADMIN",
          avatar: botAvatar
        })
      });
      const data = await res.json();
      if (data?.user) {
        setCurrentUser(data.user);
        localStorage.setItem("sentinel_session", JSON.stringify(data.user));
        showToast(`Authenticated as Master Admin (${data.user.email})`, "success");
      }
    } catch (err) {
      console.error("Failed to switch session:", err);
    }
  };

  // Fetch initial telemetry data
  const fetchData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [threatsRes, protocolsRes, contagionRes, logsRes, netRes] = await Promise.all([
        fetch("/api/threats/live").then((r) => r.json()),
        fetch("/api/protocols").then((r) => r.json()),
        fetch("/api/contagion-network").then((r) => r.json()),
        fetch("/api/guardian/logs").then((r) => r.json()),
        fetch("/api/realtime/network-status").then((r) => r.json()).catch(() => null)
      ]);

      if (threatsRes?.activeThreats) setThreats(threatsRes.activeThreats);
      if (protocolsRes?.protocols) setProtocols(protocolsRes.protocols);
      if (contagionRes?.nodes) setContagionData(contagionRes);
      if (logsRes?.history) setCircuitBreakerLogs(logsRes.history);
      if (netRes?.chains) {
        setNetworkStatus(netRes);
        const ethBlock = netRes.chains["Ethereum Mainnet"]?.blockNumber;
        if (ethBlock) setBlockNumber(ethBlock);
      }
    } catch (err) {
      console.error("Failed to fetch initial telemetry data:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time on-chain RPC poller (ticks every 4 seconds)
  useEffect(() => {
    if (!isLiveStreamActive) return;

    const timer = setInterval(async () => {
      try {
        const [netRes, threatsRes] = await Promise.all([
          fetch("/api/realtime/network-status").then((r) => r.json()).catch(() => null),
          fetch("/api/threats/live").then((r) => r.json()).catch(() => null)
        ]);

        if (netRes?.chains) {
          setNetworkStatus(netRes);
          const ethBlock = netRes.chains["Ethereum Mainnet"]?.blockNumber;
          if (ethBlock) setBlockNumber(ethBlock);
        }

        if (threatsRes?.activeThreats) {
          setThreats(threatsRes.activeThreats);
        }
      } catch (e) {
        console.warn("Real-time network status tick failed:", e);
      }
    }, 4000);

    return () => clearInterval(timer);
  }, [isLiveStreamActive]);

  // Handle Exploit Simulation from Modal or Header
  const handleRunSimulation = async (scenario: string) => {
    try {
      const response = await fetch("/api/simulate-attack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario })
      });
      const data = await response.json();
      if (data?.allThreats) {
        setThreats(data.allThreats);
        showToast(`🚨 Mempool Alert: ${data.threat.threatType} intercepted in ${data.threat.detectionLatencyMs}ms!`, "alert");
      }
      return data;
    } catch (e) {
      console.error("Simulation error:", e);
      throw e;
    }
  };

  // Trigger Guardian Circuit Breaker Pause
  const handleTriggerPause = async (protocolName: string, reason?: string, actionType?: string) => {
    try {
      const response = await fetch("/api/guardian/circuit-breaker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          protocolId: protocolName,
          reason: reason || "Emergency Pause triggered by Protocol Guardian Security Council",
          actionType: actionType || "EMERGENCY_GLOBAL_PAUSE"
        })
      });
      const data = await response.json();
      if (data?.success) {
        if (data.allLogs) setCircuitBreakerLogs(data.allLogs);
        showToast(`🛡️ ${data.message}`, "success");
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
        // Update threat list state
        fetchData();
      }
    } catch (e) {
      console.error("Circuit breaker error:", e);
      showToast("Failed to broadcast circuit breaker signal", "alert");
    }
  };

  // Trigger Gemini AI Threat Analysis
  const handleAnalyzeThreat = async (threat: ThreatEvent) => {
    setAiTargetThreat(threat);
    setAiAnalysis(null);
    setIsAiLoading(true);
    setIsAiModalOpen(true);

    try {
      const response = await fetch("/api/threats/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threatId: threat.id,
          txHash: threat.txHash,
          details: threat.details,
          threatType: threat.threatType,
          protocol: threat.protocol
        })
      });
      const data = await response.json();
      if (data?.analysis) {
        setAiAnalysis(data.analysis);
      }
    } catch (e) {
      console.error("AI Analysis error:", e);
      setAiAnalysis({
        rootCause: "Network error fetching Gemini audit report.",
        exploitVectorBreakdown: ["Retry the analysis or inspect bytecode directly."],
        mitigationRecommendation: "Isolate affected market pool immediately.",
        solidityCountermeasure: "// Error generating code",
        modelUsed: "Offline Fallback"
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  // Strict Login Gate Check: If not logged in, only show the Login block
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#07090e] text-slate-200 flex flex-col selection:bg-cyan-500 selection:text-black">
        {/* Toast Notification */}
        {toastMessage && (
          <div
            className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl border shadow-2xl flex items-center gap-3 text-xs font-medium animate-bounce-short ${
              toastMessage.type === "alert"
                ? "bg-rose-950/90 text-rose-200 border-rose-500/50"
                : "bg-emerald-950/90 text-emerald-200 border-emerald-500/50"
            }`}
          >
            {toastMessage.type === "alert" ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white ml-2 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <LoginView onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-200 flex flex-col selection:bg-cyan-500 selection:text-black">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl border shadow-2xl flex items-center gap-3 text-xs font-medium animate-bounce-short ${
            toastMessage.type === "alert"
              ? "bg-rose-950/90 text-rose-200 border-rose-500/50"
              : "bg-emerald-950/90 text-emerald-200 border-emerald-500/50"
          }`}
        >
          {toastMessage.type === "alert" ? (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        selectedChain={selectedChain}
        setSelectedChain={setSelectedChain}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        onQuickPause={() => handleTriggerPause("ApexLend v2 Vault")}
        blockNumber={blockNumber}
        currentUser={currentUser}
        onSwitchUserSession={handleSwitchSession}
        onOpenEditAvatar={() => setIsEditAvatarModalOpen(true)}
        onOpenResetPassword={() => setIsResetPasswordModalOpen(true)}
        onLogout={handleLogout}
        networkStatus={networkStatus}
        isLiveStreamActive={isLiveStreamActive}
        onToggleLiveStream={() => setIsLiveStreamActive((prev) => !prev)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {currentTab === "radar" && (
          <MempoolRadar
            threats={threats}
            selectedChain={selectedChain}
            onAnalyzeThreat={handleAnalyzeThreat}
            onTriggerPause={(proto) => handleTriggerPause(proto)}
            onOpenSimulator={() => setIsSimulatorOpen(true)}
            isRefreshing={isRefreshing}
            onRefresh={fetchData}
            networkStatus={networkStatus}
          />
        )}

        {currentTab === "health" && (
          <ProtocolHealthMatrix
            protocols={protocols}
            onSelectProtocol={(p) => setSelectedProtocolDetail(p)}
            onTriggerPause={(proto) => handleTriggerPause(proto)}
          />
        )}

        {currentTab === "contagion" && (
          <ContagionGraphView
            graphData={contagionData}
            onTriggerPause={(proto) => handleTriggerPause(proto)}
          />
        )}

        {currentTab === "guardian" && (
          <CircuitBreakerView
            logs={circuitBreakerLogs}
            onTriggerPause={handleTriggerPause}
          />
        )}

        {currentTab === "users" && (
          <UserMonitoringView
            currentUser={currentUser}
            onNavigateToView={(tab) => setCurrentTab(tab)}
            onLogout={handleLogout}
            onUpdateCurrentUser={(updated) => {
              setCurrentUser(updated);
              localStorage.setItem("sentinel_session", JSON.stringify(updated));
            }}
          />
        )}

        {currentTab === "admin" && (
          <AdminActivitiesView
            currentUser={currentUser}
            onNavigateToView={(tab) => setCurrentTab(tab)}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#080b12] py-4 text-xs text-slate-500 font-mono-code">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">SENTINEL PROTOCOL</span>
            <span>·</span>
            <span>Authoritative Main Server Engine</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-cyan-400">Zero-Custody Enclave</span>
            <span>·</span>
            <span>Sub-400ms State Diff Attestation</span>
            <span>·</span>
            <span className="text-slate-400">Authority: rajangovinda036@gmail.com</span>
            <span>·</span>
            <button
              onClick={handleLogout}
              id="btn-footer-logout"
              className="text-rose-400 hover:text-rose-300 transition-colors cursor-pointer underline underline-offset-2"
              title="Log out of master session"
            >
              Log Out
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ExploitSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onRunSimulation={handleRunSimulation}
      />

      <AiAnalystModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        threat={aiTargetThreat}
        analysis={aiAnalysis}
        isLoading={isAiLoading}
      />

      <ProtocolDetailModal
        protocol={selectedProtocolDetail}
        isOpen={!!selectedProtocolDetail}
        onClose={() => setSelectedProtocolDetail(null)}
        onTriggerPause={handleTriggerPause}
      />

      {/* Customizable Bot Avatar Modal */}
      <EditBotAvatarModal
        isOpen={isEditAvatarModalOpen}
        onClose={() => setIsEditAvatarModalOpen(false)}
        currentUser={currentUser}
        onUpdateUser={(updated) => {
          setCurrentUser(updated);
          localStorage.setItem("sentinel_session", JSON.stringify(updated));
          showToast("Bot profile avatar updated successfully!", "success");
        }}
      />

      {/* Password Reset via Email Verification Modal */}
      <PasswordResetModal
        isOpen={isResetPasswordModalOpen}
        onClose={() => setIsResetPasswordModalOpen(false)}
        authorizedEmail={currentUser?.email || "rajangovinda036@gmail.com"}
        onPasswordResetSuccess={(newPass) => {
          showToast(`Master password updated successfully! New key: ${newPass}`, "success");
        }}
      />
    </div>
  );
}
