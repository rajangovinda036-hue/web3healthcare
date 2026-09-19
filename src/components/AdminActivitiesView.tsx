import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldAlert,
  Users,
  Search,
  Filter,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Globe,
  Radio,
  ExternalLink,
  Lock,
  Cpu,
  Eye,
  Flag,
  UserCheck,
  Zap,
  Check,
  X,
  FileCode,
  SlidersHorizontal,
  PlusCircle,
  Activity,
  ChevronRight,
  Trash2,
  Edit3,
  Power,
  Server,
  HardDrive,
  Terminal,
  LogOut
} from "lucide-react";
import { UserActivity, AdminUserSummary, ProtocolHealth, ThreatEvent, SystemConfig, ServerStats, CurrentUserSession } from "../types";

interface AdminActivitiesViewProps {
  currentUser?: CurrentUserSession;
  onNavigateToView?: (tab: string) => void;
  onLogCustomActivity?: (action: string, category: string, target: string) => void;
  onLogout?: () => void;
}

export const AdminActivitiesView: React.FC<AdminActivitiesViewProps> = ({
  currentUser,
  onNavigateToView,
  onLogCustomActivity,
  onLogout
}) => {
  const currentEmail = currentUser?.email || "rajangovinda036@gmail.com";
  const isAuthorizedAdmin = currentEmail.toLowerCase() === "rajangovinda036@gmail.com";

  // Navigation sub-tab
  const [activeSubTab, setActiveSubTab] = useState<
    "stream" | "protocols" | "threats" | "users" | "policies" | "diagnostics"
  >("stream");

  // Telemetry & Data States
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [protocols, setProtocols] = useState<ProtocolHealth[]>([]);
  const [threats, setThreats] = useState<ThreatEvent[]>([]);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    serverName: "Sentinel Threat Detection & Protocol Health Engine",
    version: "2026.1.0-alpha",
    autoPauseEnabled: true,
    latencyThresholdMs: 400,
    lossThresholdUsd: 5000000,
    guardianQuorum: "4-of-7",
    emergencyGlobalPause: false,
    mempoolSampleRateTps: 2850,
    relayerRpc: "https://eth-mainnet.enclave-guardian.net/rpc",
    zeroCustodyEnforced: true,
    geminiModel: "gemini-3.8-flash",
  });
  const [serverStats, setServerStats] = useState<ServerStats | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Filter States for Activities
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Modals
  const [inspectingActivity, setInspectingActivity] = useState<UserActivity | null>(null);
  const [isSimulateActionOpen, setIsSimulateActionOpen] = useState<boolean>(false);
  const [isAddProtocolOpen, setIsAddProtocolOpen] = useState<boolean>(false);
  const [editingProtocol, setEditingProtocol] = useState<ProtocolHealth | null>(null);
  const [isAddThreatOpen, setIsAddThreatOpen] = useState<boolean>(false);
  const [editingThreat, setEditingThreat] = useState<ThreatEvent | null>(null);
  const [isAddUserOpen, setIsAddUserOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<AdminUserSummary | null>(null);

  // Form States: Simulate Action
  const [simUser, setSimUser] = useState<string>("usr-admin-01");
  const [simAction, setSimAction] = useState<string>("Manual Mempool State Snapshot");
  const [simCategory, setSimCategory] = useState<string>("MONITORING");
  const [simTarget, setSimTarget] = useState<string>("Uniswap V3 WETH/USDC");
  const [simDetails, setSimDetails] = useState<string>("Exported sub-second state diff for TWAP deviation audit.");

  // Form States: New Protocol
  const [newProtoName, setNewProtoName] = useState("");
  const [newProtoCategory, setNewProtoCategory] = useState("Lending & Borrowing");
  const [newProtoChain, setNewProtoChain] = useState("Ethereum Mainnet");
  const [newProtoTvl, setNewProtoTvl] = useState(250000000);
  const [newProtoCar, setNewProtoCar] = useState(15000000);
  const [newProtoHealth, setNewProtoHealth] = useState(88);
  const [newProtoBuffer, setNewProtoBuffer] = useState(30);

  // Form States: New Threat
  const [newThreatProto, setNewThreatProto] = useState("Aave V3 Core");
  const [newThreatType, setNewThreatType] = useState<any>("Flash Loan Arbitrage & Oracle Skew");
  const [newThreatSeverity, setNewThreatSeverity] = useState<any>("CRITICAL");
  const [newThreatLoss, setNewThreatLoss] = useState(12500000);
  const [newThreatChain, setNewThreatChain] = useState("Ethereum Mainnet");
  const [newThreatDetails, setNewThreatDetails] = useState("Mempool buffer detected synthetic balance imbalance.");

  // Form States: New User
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<any>("GUARDIAN_OPERATOR");
  const [newUserWallet, setNewUserWallet] = useState("");
  const [newUserLocation, setNewUserLocation] = useState("Singapore Enclave Node");

  // Show transient action feedback
  const showFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  // Master fetch function from main server
  const fetchAllServerData = async () => {
    setIsRefreshing(true);
    try {
      const headers = { "x-user-email": currentEmail };
      const [actRes, usersRes, protoRes, threatsRes, configRes, statsRes] = await Promise.all([
        fetch("/api/admin/activities", { headers }).then((r) => r.json()).catch(() => ({})),
        fetch("/api/admin/users", { headers }).then((r) => r.json()).catch(() => ({})),
        fetch("/api/protocols").then((r) => r.json()).catch(() => ({})),
        fetch("/api/threats/live").then((r) => r.json()).catch(() => ({})),
        fetch("/api/admin/system/config", { headers }).then((r) => r.json()).catch(() => ({})),
        fetch("/api/admin/server-stats", { headers }).then((r) => r.json()).catch(() => ({})),
      ]);

      if (actRes?.activities) setActivities(actRes.activities);
      if (usersRes?.users) setUsers(usersRes.users);
      if (protoRes?.protocols) setProtocols(protoRes.protocols);
      if (threatsRes?.activeThreats) setThreats(threatsRes.activeThreats);
      if (configRes?.config) setSystemConfig(configRes.config);
      if (statsRes?.stats) setServerStats(statsRes.stats);
    } catch (err) {
      console.error("Failed to load server admin data:", err);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllServerData();
  }, []);

  // Periodic polling
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchAllServerData();
    }, 8000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Toggle Anomaly Flag on an Activity
  const handleToggleFlag = async (activity: UserActivity) => {
    try {
      const res = await fetch("/api/admin/flag-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityId: activity.id,
          isAnomaly: !activity.isAnomaly,
        }),
      });
      const data = await res.json();
      if (data?.success) {
        setActivities((prev) =>
          prev.map((a) => (a.id === activity.id ? data.activity : a))
        );
        if (inspectingActivity?.id === activity.id) {
          setInspectingActivity(data.activity);
        }
        showFeedback(data.activity.isAnomaly ? "Activity flagged as anomaly" : "Anomaly flag cleared");
      }
    } catch (e) {
      console.error("Failed to flag activity:", e);
    }
  };

  // Submit Simulated User Action
  const handleCreateSimulatedAction = async (e: React.FormEvent) => {
    e.preventDefault();
    const chosenUser = users.find((u) => u.id === simUser) || {
      id: "usr-admin-01",
      name: "Govindarajan S",
      email: "rajangovinda036@gmail.com",
      role: "SUPER_ADMIN" as const,
    };

    try {
      const res = await fetch("/api/admin/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: chosenUser.id,
          userName: chosenUser.name,
          userEmail: chosenUser.email,
          userRole: chosenUser.role,
          action: simAction,
          actionCategory: simCategory,
          targetResource: simTarget,
          details: simDetails,
          ipAddress: "157.49.214.88",
          userAgent: "Mozilla/5.0 (Admin Dashboard Web)",
          status: "SUCCESS",
          latencyMs: Math.floor(40 + Math.random() * 80),
        }),
      });
      const data = await res.json();
      if (data?.success) {
        setIsSimulateActionOpen(false);
        fetchAllServerData();
        showFeedback("Simulated user action logged to server audit trail");
      }
    } catch (err) {
      console.error("Failed to inject simulated action:", err);
    }
  };

  // Purge Historical Logs
  const handlePurgeAuditLogs = async () => {
    if (!window.confirm("Purge historical audit logs and retain only the latest 10 cryptographic records?")) {
      return;
    }
    try {
      const res = await fetch("/api/admin/activities/purge", { method: "POST" });
      const data = await res.json();
      if (data?.success) {
        fetchAllServerData();
        showFeedback("Audit logs pruned successfully");
      }
    } catch (err) {
      console.error("Purge error:", err);
    }
  };

  // Export Audit Log to JSON
  const handleExportAuditLog = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(activities, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `sentinel-security-audit-log-${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showFeedback("Exported security audit log JSON");
  };

  // PROTOCOLS: Add
  const handleCreateProtocol = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/protocols", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProtoName,
          category: newProtoCategory,
          chain: newProtoChain,
          tvlUsd: newProtoTvl,
          collateralAtRiskUsd: newProtoCar,
          healthScore: newProtoHealth,
          liquidationBufferPct: newProtoBuffer,
          status: "HEALTHY",
          riskGrade: newProtoHealth >= 90 ? "A+" : newProtoHealth >= 80 ? "A" : "B",
        }),
      });
      const data = await res.json();
      if (data?.success) {
        setIsAddProtocolOpen(false);
        setNewProtoName("");
        fetchAllServerData();
        showFeedback(`Protocol ${data.protocol.name} registered`);
      }
    } catch (err) {
      console.error("Failed to add protocol:", err);
    }
  };

  // PROTOCOLS: Update
  const handleUpdateProtocol = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProtocol) return;
    try {
      const res = await fetch(`/api/admin/protocols/${editingProtocol.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingProtocol),
      });
      const data = await res.json();
      if (data?.success) {
        setEditingProtocol(null);
        fetchAllServerData();
        showFeedback(`Protocol ${data.protocol.name} updated`);
      }
    } catch (err) {
      console.error("Failed to update protocol:", err);
    }
  };

  // PROTOCOLS: Toggle Pause Status Directly
  const handleToggleProtocolPause = async (proto: ProtocolHealth) => {
    const nextStatus = proto.status === "CRITICAL_DEFICIT" ? "HEALTHY" : "CRITICAL_DEFICIT";
    try {
      const res = await fetch(`/api/admin/protocols/${proto.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (data?.success) {
        fetchAllServerData();
        showFeedback(`${proto.name} status set to ${nextStatus}`);
      }
    } catch (err) {
      console.error("Failed to toggle protocol pause:", err);
    }
  };

  // PROTOCOLS: Delete
  const handleDeleteProtocol = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from active monitoring?`)) return;
    try {
      const res = await fetch(`/api/admin/protocols/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data?.success) {
        fetchAllServerData();
        showFeedback(`Protocol ${name} removed`);
      }
    } catch (err) {
      console.error("Failed to delete protocol:", err);
    }
  };

  // THREATS: Create
  const handleCreateThreat = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/threats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          protocol: newThreatProto,
          threatType: newThreatType,
          severity: newThreatSeverity,
          potentialLossUsd: newThreatLoss,
          chain: newThreatChain,
          details: newThreatDetails,
        }),
      });
      const data = await res.json();
      if (data?.success) {
        setIsAddThreatOpen(false);
        fetchAllServerData();
        showFeedback(`Threat incident injected into live mempool`);
      }
    } catch (err) {
      console.error("Failed to create threat:", err);
    }
  };

  // THREATS: Update Status
  const handleUpdateThreatStatus = async (threatId: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/threats/${threatId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data?.success) {
        setEditingThreat(null);
        fetchAllServerData();
        showFeedback(`Threat marked as ${status}`);
      }
    } catch (err) {
      console.error("Failed to update threat:", err);
    }
  };

  // THREATS: Delete/Dismiss
  const handleDeleteThreat = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/threats/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data?.success) {
        fetchAllServerData();
        showFeedback(`Threat incident dismissed`);
      }
    } catch (err) {
      console.error("Failed to delete threat:", err);
    }
  };

  // USERS: Add
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          role: newUserRole,
          walletAddress: newUserWallet,
          ipLocation: newUserLocation,
        }),
      });
      const data = await res.json();
      if (data?.success) {
        setIsAddUserOpen(false);
        setNewUserName("");
        setNewUserEmail("");
        setNewUserWallet("");
        fetchAllServerData();
        showFeedback(`Operator ${data.user.name} registered`);
      }
    } catch (err) {
      console.error("Failed to create user:", err);
    }
  };

  // USERS: Update
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingUser),
      });
      const data = await res.json();
      if (data?.success) {
        setEditingUser(null);
        fetchAllServerData();
        showFeedback(`User ${data.user.name} updated`);
      }
    } catch (err) {
      console.error("Failed to update user:", err);
    }
  };

  // USERS: Delete
  const handleDeleteUser = async (id: string, name: string) => {
    if (!window.confirm(`Revoke credentials and access for ${name}?`)) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data?.success) {
        fetchAllServerData();
        showFeedback(`Access revoked for ${name}`);
      }
    } catch (err) {
      console.error("Failed to delete user:", err);
    }
  };

  // SYSTEM CONFIG: Save Policies
  const handleSaveSystemConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/system/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(systemConfig),
      });
      const data = await res.json();
      if (data?.success) {
        setSystemConfig(data.config);
        fetchAllServerData();
        showFeedback("Global system policies saved");
      }
    } catch (err) {
      console.error("Failed to save system config:", err);
    }
  };

  // SYSTEM CONFIG: Emergency Global Killswitch
  const handleToggleGlobalKillswitch = async () => {
    const nextState = !systemConfig.emergencyGlobalPause;
    const confirmText = nextState
      ? "EMERGENCY GLOBAL KILLSWITCH: This will trigger an immediate emergency pause across ALL monitored protocol vaults and bridges. Proceed?"
      : "Disengage Global Killswitch and resume normal operations?";
    if (!window.confirm(confirmText)) return;

    try {
      const res = await fetch("/api/admin/system/emergency-freeze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pauseState: nextState }),
      });
      const data = await res.json();
      if (data?.success) {
        setSystemConfig((prev) => ({
          ...prev,
          emergencyGlobalPause: data.emergencyGlobalPause,
        }));
        fetchAllServerData();
        showFeedback(
          data.emergencyGlobalPause
            ? "GLOBAL KILLSWITCH ENGAGED across all protocols"
            : "Global killswitch disengaged"
        );
      }
    } catch (err) {
      console.error("Failed to toggle global killswitch:", err);
    }
  };

  // Filtered activities list
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      if (selectedRole !== "ALL" && act.userRole !== selectedRole) return false;
      if (selectedCategory !== "ALL" && act.actionCategory !== selectedCategory) return false;
      if (selectedStatus !== "ALL" && act.status !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          act.userName.toLowerCase().includes(q) ||
          act.userEmail.toLowerCase().includes(q) ||
          act.action.toLowerCase().includes(q) ||
          act.targetResource.toLowerCase().includes(q) ||
          act.ipAddress.toLowerCase().includes(q) ||
          act.details.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [activities, selectedRole, selectedCategory, selectedStatus, searchQuery]);

  // Helper formatting relative time
  const formatTimeAgo = (isoString: string) => {
    try {
      const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
      if (diffSec < 60) return `${diffSec}s ago`;
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      return `${Math.floor(diffSec / 3600)}h ago`;
    } catch {
      return "recently";
    }
  };

  // Role Badge
  const renderRoleBadge = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-fuchsia-950/60 text-fuchsia-300 border border-fuchsia-800/60">
            SUPER ADMIN
          </span>
        );
      case "GUARDIAN_OPERATOR":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-cyan-950/60 text-cyan-300 border border-cyan-800/60">
            GUARDIAN
          </span>
        );
      case "PROTOCOL_AUDITOR":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-indigo-950/60 text-indigo-300 border border-indigo-800/60">
            AUDITOR
          </span>
        );
      case "RISK_ANALYST":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
            ANALYST
          </span>
        );
      case "EXTERNAL_AGENT":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-amber-950/60 text-amber-300 border border-amber-800/60">
            BOT / AGENT
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono-code bg-slate-800 text-slate-300">
            {role}
          </span>
        );
    }
  };

  // Status Badge
  const renderStatusBadge = (status: string, isAnomaly?: boolean) => {
    if (isAnomaly || status === "FLAGGED") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-rose-900/60 text-rose-300 border border-rose-500 animate-pulse">
          <AlertTriangle className="w-3 h-3" />
          ANOMALY
        </span>
      );
    }
    if (status === "WARNING") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-amber-950/60 text-amber-300 border border-amber-700">
          WARNING
        </span>
      );
    }
    if (status === "BLOCKED") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-red-950/60 text-red-400 border border-red-800">
          BLOCKED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-800">
        <CheckCircle2 className="w-3 h-3" />
        SUCCESS
      </span>
    );
  };

  // Restrict administrative access strictly to rajangovinda036@gmail.com
  if (!isAuthorizedAdmin) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 max-w-2xl mx-auto my-12 text-center space-y-5 shadow-2xl backdrop-blur-md">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/10">
          <Lock className="w-8 h-8" />
        </div>
        
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">
            Administrative Management Center Restricted
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono-code">
            AUTHORITATIVE MAIN SERVER SECURITY ENFORCEMENT
          </p>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed max-w-lg mx-auto">
          Administrative controls, protocol mutation settings, and sensitive server configuration are reserved strictly for authorized administrator{" "}
          <span className="text-cyan-400 font-mono-code font-bold">rajangovinda036@gmail.com</span>. All other sessions operate with standard user permissions.
        </p>

        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-400 font-mono-code text-left space-y-2 max-w-md mx-auto">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Active Session:</span>
            <span className="text-slate-200">{currentEmail}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Access Role:</span>
            <span className="text-amber-400 font-semibold">Standard User</span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
            <span className="text-slate-500">Status:</span>
            <span className="text-rose-400 font-bold">Admin Details Hidden</span>
          </div>
        </div>

        <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => onNavigateToView && onNavigateToView("users")}
            id="btn-goto-user-monitoring"
            className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Users className="w-4 h-4" />
            <span>Open User Monitoring Block</span>
          </button>
          <button
            onClick={() => onNavigateToView && onNavigateToView("radar")}
            id="btn-goto-mempool-radar"
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
          >
            Go to Mempool Radar
          </button>
          {onLogout && (
            <button
              onClick={onLogout}
              id="btn-restricted-logout"
              className="px-4 py-2.5 bg-rose-950/50 hover:bg-rose-900/70 text-rose-300 text-xs font-semibold rounded-xl border border-rose-800/60 flex items-center gap-2 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span>Log Out</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {actionFeedback && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-indigo-500/50 text-white text-xs font-semibold shadow-2xl shadow-indigo-500/20 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Top Admin Header & Context Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-gradient-to-br from-fuchsia-600/30 to-indigo-600/30 text-fuchsia-400 border border-fuchsia-500/40">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-wide">
                Main Server Administrative Management Center
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono-code font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Authoritative Master Server
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Unified governance, full CRUD control over protocols, threats, guardians, SLA thresholds, and live mempool telemetry.
            </p>
          </div>
        </div>

        {/* Current Admin Identity & Quick Action Bar */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Admin Identity Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <div className="font-mono-code">
              <span className="text-slate-400">Admin: </span>
              <span className="text-white font-semibold">Govindarajan S</span>
              <span className="text-slate-500 text-[10px] block truncate max-w-[140px]">
                rajangovinda036@gmail.com
              </span>
            </div>
          </div>

          {/* Global Killswitch Quick Button */}
          <button
            onClick={handleToggleGlobalKillswitch}
            id="btn-global-killswitch-header"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer border shadow-sm ${
              systemConfig.emergencyGlobalPause
                ? "bg-rose-600 text-white border-rose-500 animate-pulse shadow-rose-600/40"
                : "bg-slate-950 hover:bg-rose-950 text-rose-300 border-rose-800/60"
            }`}
            title="Global System-Wide Emergency Pause"
          >
            <Power className="w-3.5 h-3.5" />
            <span>{systemConfig.emergencyGlobalPause ? "FREEZE ACTIVE" : "Killswitch"}</span>
          </button>

          <button
            onClick={() => setIsSimulateActionOpen(true)}
            id="btn-simulate-user-action"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors cursor-pointer shadow-sm shadow-indigo-600/30"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Simulate Action</span>
          </button>

          <button
            onClick={fetchAllServerData}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
            title="Sync with Main Server"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              id="btn-admin-logout"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/50 hover:bg-rose-900/70 text-rose-300 border border-rose-800/70 hover:border-rose-500 font-semibold text-xs transition-colors cursor-pointer"
              title="Log out of master administrative session"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Log Out</span>
            </button>
          )}
        </div>
      </div>

      {/* Server Status KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 space-y-0.5">
          <div className="text-[11px] text-slate-400">Total Protocols</div>
          <div className="text-xl font-bold font-mono-code text-white">{protocols.length}</div>
          <div className="text-[10px] text-cyan-400">Tracked in Health Matrix</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 space-y-0.5">
          <div className="text-[11px] text-slate-400">Active Threats</div>
          <div className="text-xl font-bold font-mono-code text-rose-400">{threats.length}</div>
          <div className="text-[10px] text-rose-300">Pre-execution buffer</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 space-y-0.5">
          <div className="text-[11px] text-slate-400">Guardians & Users</div>
          <div className="text-xl font-bold font-mono-code text-indigo-300">{users.length}</div>
          <div className="text-[10px] text-indigo-400">
            {users.filter((u) => u.status === "ONLINE").length} active online
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 space-y-0.5">
          <div className="text-[11px] text-slate-400">Audit Events</div>
          <div className="text-xl font-bold font-mono-code text-emerald-400">{activities.length}</div>
          <div className="text-[10px] text-slate-500">Immutable hashes logged</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 space-y-0.5">
          <div className="text-[11px] text-slate-400">Circuit SLA Threshold</div>
          <div className="text-xl font-bold font-mono-code text-cyan-300">
            &lt;{systemConfig.latencyThresholdMs}ms
          </div>
          <div className="text-[10px] text-emerald-400">Quorum {systemConfig.guardianQuorum}</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 space-y-0.5">
          <div className="text-[11px] text-slate-400">Main Server Health</div>
          <div className="text-xl font-bold font-mono-code text-emerald-400">100%</div>
          <div className="text-[10px] text-slate-400">Port 3000 Unified</div>
        </div>
      </div>

      {/* Main Admin Management Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-2 gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveSubTab("stream")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === "stream"
                ? "bg-fuchsia-600 text-white shadow-md shadow-fuchsia-600/30"
                : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            Audit Logs ({filteredActivities.length})
          </button>

          <button
            onClick={() => setActiveSubTab("protocols")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === "protocols"
                ? "bg-fuchsia-600 text-white shadow-md shadow-fuchsia-600/30"
                : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            Protocols Manager ({protocols.length})
          </button>

          <button
            onClick={() => setActiveSubTab("threats")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === "threats"
                ? "bg-fuchsia-600 text-white shadow-md shadow-fuchsia-600/30"
                : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            Threats & Incidents ({threats.length})
          </button>

          <button
            onClick={() => setActiveSubTab("users")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === "users"
                ? "bg-fuchsia-600 text-white shadow-md shadow-fuchsia-600/30"
                : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            Guardians & Users ({users.length})
          </button>

          <button
            onClick={() => setActiveSubTab("policies")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === "policies"
                ? "bg-fuchsia-600 text-white shadow-md shadow-fuchsia-600/30"
                : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            Circuit Breaker Policies
          </button>

          <button
            onClick={() => setActiveSubTab("diagnostics")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === "diagnostics"
                ? "bg-fuchsia-600 text-white shadow-md shadow-fuchsia-600/30"
                : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            Server Diagnostics
          </button>
        </div>

        {/* Polling Toggle */}
        <div className="flex items-center gap-2 text-xs font-mono-code text-slate-400">
          <span>Auto-poll (8s):</span>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`w-8 h-4 rounded-full transition-colors relative cursor-pointer ${
              autoRefresh ? "bg-emerald-600" : "bg-slate-700"
            }`}
          >
            <div
              className={`w-3 h-3 rounded-full bg-white transition-transform absolute top-0.5 ${
                autoRefresh ? "left-4.5" : "left-0.5"
              }`}
            />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: LIVE ACTIVITY STREAM */}
      {/* ========================================================================= */}
      {activeSubTab === "stream" && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search user, action, target resource, IP address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-fuchsia-500 font-sans"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2 font-mono-code">
              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 px-2 py-1 rounded-lg">
                <span className="text-[10px] text-slate-500">Role:</span>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="bg-transparent text-slate-300 text-xs focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Roles</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="GUARDIAN_OPERATOR">Guardian</option>
                  <option value="PROTOCOL_AUDITOR">Auditor</option>
                  <option value="RISK_ANALYST">Analyst</option>
                  <option value="EXTERNAL_AGENT">Bot / Agent</option>
                </select>
              </div>

              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 px-2 py-1 rounded-lg">
                <span className="text-[10px] text-slate-500">Category:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-transparent text-slate-300 text-xs focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Categories</option>
                  <option value="SECURITY_OVERRIDE">Security Override</option>
                  <option value="EXPLOIT_SIMULATION">Simulation</option>
                  <option value="AI_AUDIT">AI Audit</option>
                  <option value="MONITORING">Monitoring</option>
                  <option value="CONFIGURATION">Configuration</option>
                  <option value="AUTHENTICATION">Auth</option>
                </select>
              </div>

              <button
                onClick={handleExportAuditLog}
                className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Export</span>
              </button>

              <button
                onClick={handlePurgeAuditLogs}
                className="flex items-center gap-1 px-2.5 py-1 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded-lg text-xs font-semibold border border-rose-800/60 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Prune Logs</span>
              </button>
            </div>
          </div>

          {/* Activities Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 font-mono-code text-[11px]">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Operator / User</th>
                    <th className="py-3 px-4">Action & Category</th>
                    <th className="py-3 px-4">Target Resource</th>
                    <th className="py-3 px-4">IP & Network</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredActivities.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        No activities match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredActivities.map((act) => (
                      <tr
                        key={act.id}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          act.isAnomaly ? "bg-rose-950/20" : ""
                        }`}
                      >
                        <td className="py-3 px-4 font-mono-code text-slate-400 whitespace-nowrap">
                          <span className="text-white font-medium block">
                            {formatTimeAgo(act.timestamp)}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(act.timestamp).toLocaleTimeString()}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-white shrink-0">
                              {act.userName.charAt(0)}
                            </div>
                            <div>
                              <div className="font-semibold text-white">{act.userName}</div>
                              <div className="flex items-center gap-1 mt-0.5">
                                {renderRoleBadge(act.userRole)}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-200">{act.action}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-mono-code text-slate-400">
                              {act.actionCategory}
                            </span>
                            {act.latencyMs && (
                              <span className="text-[10px] font-mono-code text-cyan-400">
                                {act.latencyMs}ms
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono-code text-slate-300">
                          <span className="font-semibold text-cyan-300 block truncate max-w-[170px]">
                            {act.targetResource}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate max-w-[200px] block">
                            {act.details}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-mono-code text-slate-400 text-[11px]">
                          <div className="flex items-center gap-1 text-slate-300">
                            <Globe className="w-3 h-3 text-slate-500" />
                            <span>{act.ipAddress}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 block truncate max-w-[130px]">
                            {act.userAgent}
                          </span>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          {renderStatusBadge(act.status, act.isAnomaly)}
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setInspectingActivity(act)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                              title="Inspect Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleToggleFlag(act)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                act.isAnomaly
                                  ? "bg-rose-600/30 text-rose-300 hover:bg-rose-600/40 border border-rose-500/40"
                                  : "bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400"
                              }`}
                              title={act.isAnomaly ? "Unflag Anomaly" : "Flag Anomaly"}
                            >
                              <Flag className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: PROTOCOLS MANAGER */}
      {/* ========================================================================= */}
      {activeSubTab === "protocols" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div>
              <h3 className="font-bold text-white text-sm">Monitored Protocol Vaults & Matrix</h3>
              <p className="text-xs text-slate-400">
                Manage all registered DeFi protocols, TVL, Collateral at Risk (CaR), liquidation buffers, and emergency circuit breaker status.
              </p>
            </div>
            <button
              onClick={() => setIsAddProtocolOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors cursor-pointer shadow-md shadow-indigo-600/30"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Protocol</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {protocols.map((proto) => (
              <div
                key={proto.id}
                className={`bg-slate-900/80 border rounded-2xl p-5 space-y-4 shadow-xl relative overflow-hidden transition-all ${
                  proto.status === "CRITICAL_DEFICIT"
                    ? "border-rose-500/60 bg-rose-950/20"
                    : "border-slate-800 hover:border-slate-700"
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-white text-sm">{proto.name}</h4>
                    <span className="text-[11px] text-slate-400 font-mono-code">
                      {proto.category} · {proto.chain}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono-code font-bold ${
                        proto.status === "HEALTHY"
                          ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800"
                          : proto.status === "ELEVATED_RISK"
                          ? "bg-amber-950/80 text-amber-400 border border-amber-800"
                          : "bg-rose-950/80 text-rose-400 border border-rose-800 animate-pulse"
                      }`}
                    >
                      {proto.status}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-cyan-300">
                      Grade {proto.riskGrade}
                    </span>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono-code bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <div>
                    <span className="text-[10px] text-slate-500 block">TVL:</span>
                    <span className="text-white font-bold">
                      ${(proto.tvlUsd / 1000000000).toFixed(2)}B
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Collateral at Risk:</span>
                    <span className="text-rose-400 font-bold">
                      ${(proto.collateralAtRiskUsd / 1000000).toFixed(1)}M
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Health Score:</span>
                    <span
                      className={`font-bold ${
                        proto.healthScore >= 85 ? "text-emerald-400" : "text-amber-400"
                      }`}
                    >
                      {proto.healthScore}/100
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Liq. Buffer:</span>
                    <span className="text-cyan-400 font-bold">{proto.liquidationBufferPct}%</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                  <button
                    onClick={() => handleToggleProtocolPause(proto)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                      proto.status === "CRITICAL_DEFICIT"
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                        : "bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800"
                    }`}
                  >
                    <Power className="w-3 h-3" />
                    <span>{proto.status === "CRITICAL_DEFICIT" ? "Resume Vault" : "Pause Vault"}</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setEditingProtocol(proto)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                      title="Edit Protocol Parameters"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteProtocol(proto.id, proto.name)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 cursor-pointer"
                      title="Remove Protocol"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 3: THREATS & INCIDENTS MANAGER */}
      {/* ========================================================================= */}
      {activeSubTab === "threats" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div>
              <h3 className="font-bold text-white text-sm">Active Threats & Live Mempool Buffer</h3>
              <p className="text-xs text-slate-400">
                Pre-execution mempool exploits intercepted in under 400ms. Modify attack severity, manually resolve incidents, or launch AI decompilations.
              </p>
            </div>
            <button
              onClick={() => setIsAddThreatOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors cursor-pointer shadow-md shadow-rose-600/30"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Threat Incident</span>
            </button>
          </div>

          <div className="space-y-3">
            {threats.map((threat) => (
              <div
                key={threat.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl transition-all"
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-rose-950 text-rose-300 border border-rose-800">
                        {threat.severity}
                      </span>
                      <h4 className="font-bold text-white text-sm">{threat.threatType}</h4>
                      <span className="text-xs text-slate-400 font-mono-code">({threat.id})</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                      <span className="text-white font-semibold">{threat.protocol}</span>
                      <span>·</span>
                      <span className="font-mono-code text-cyan-400">{threat.chain}</span>
                      <span>·</span>
                      <span className="text-slate-500">{formatTimeAgo(threat.timestamp)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 font-mono-code">
                    <span className="text-xs text-slate-400">Status:</span>
                    <select
                      value={threat.status}
                      onChange={(e) => handleUpdateThreatStatus(threat.id, e.target.value)}
                      className="bg-slate-950 border border-slate-700 text-slate-200 text-xs px-2 py-1 rounded-lg focus:outline-none cursor-pointer"
                    >
                      <option value="DETECTED_PRE_EXECUTION">DETECTED_PRE_EXECUTION</option>
                      <option value="CIRCUIT_BREAKER_TRIGGERED">CIRCUIT_BREAKER_TRIGGERED</option>
                      <option value="MITIGATED">MITIGATED</option>
                      <option value="MONITORING">MONITORING</option>
                    </select>

                    <button
                      onClick={() => handleDeleteThreat(threat.id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 cursor-pointer"
                      title="Dismiss Threat"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 text-xs font-mono-code">
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block">Potential Loss:</span>
                    <span className="text-rose-400 font-bold">
                      ${(threat.potentialLossUsd / 1000000).toFixed(1)}M
                    </span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block">Borrowed Capital:</span>
                    <span className="text-amber-400 font-bold">
                      ${(threat.borrowedCapitalUsd / 1000000).toFixed(1)}M
                    </span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block">Detection Latency:</span>
                    <span className="text-cyan-400 font-bold">{threat.detectionLatencyMs}ms</span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block">Confidence Score:</span>
                    <span className="text-emerald-400 font-bold">{threat.confidenceScore}%</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/50">
                  {threat.details}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 4: GUARDIANS & USERS DIRECTORY */}
      {/* ========================================================================= */}
      {activeSubTab === "users" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div>
              <h3 className="font-bold text-white text-sm">Guardians, Auditors & Operators Directory</h3>
              <p className="text-xs text-slate-400">
                Manage multisig signers, SGX enclave guardians, protocol auditors, and administrative roles.
              </p>
            </div>
            <button
              onClick={() => setIsAddUserOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors cursor-pointer shadow-md shadow-indigo-600/30"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Operator</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((usr) => (
              <div
                key={usr.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-4 shadow-xl relative overflow-hidden transition-all"
              >
                {usr.role === "SUPER_ADMIN" && (
                  <div className="absolute top-0 right-0 px-3 py-0.5 bg-fuchsia-600 text-white font-mono-code text-[9px] font-bold rounded-bl-xl uppercase tracking-wider">
                    Current Super Admin
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <img
                    src={usr.avatar}
                    alt={usr.name}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-700"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-white text-sm">{usr.name}</h4>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          usr.status === "ONLINE"
                            ? "bg-emerald-400"
                            : usr.status === "IDLE"
                            ? "bg-amber-400"
                            : "bg-slate-600"
                        }`}
                        title={`Status: ${usr.status}`}
                      />
                    </div>
                    <div className="text-xs text-slate-400 font-mono-code">{usr.email}</div>
                    <div className="mt-1">{renderRoleBadge(usr.role)}</div>
                  </div>
                </div>

                <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-xs font-mono-code">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Signer Wallet:</span>
                    <span className="text-cyan-400 font-bold">
                      {usr.walletAddress.slice(0, 6)}...{usr.walletAddress.slice(-4)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Enclave Node:</span>
                    <span className="text-slate-300">{usr.ipLocation}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Actions (24h):</span>
                    <span className="text-emerald-400 font-bold">{usr.actionsCount24h} ops</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                  <button
                    onClick={() => setEditingUser(usr)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit User</span>
                  </button>

                  {usr.role !== "SUPER_ADMIN" && (
                    <button
                      onClick={() => handleDeleteUser(usr.id, usr.name)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 text-xs font-semibold border border-rose-800/50 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Revoke</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 5: CIRCUIT BREAKER POLICIES & CONTROLS */}
      {/* ========================================================================= */}
      {activeSubTab === "policies" && (
        <form
          onSubmit={handleSaveSystemConfig}
          className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-fuchsia-400" />
                Global Circuit Breaker & Enclave Quorum Policies
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Configure deterministic cryptographic thresholds, SLA limits, and relayer parameters enforced by the main server.
              </p>
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs cursor-pointer shadow-md shadow-indigo-600/30"
            >
              Save Policies
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* Auto-pause toggle */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <label className="text-slate-300 font-bold block">Autonomous Circuit Breaker Auto-Pause:</label>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">
                  {systemConfig.autoPauseEnabled
                    ? "Sub-400ms automatic pause dispatch enabled"
                    : "Manual confirmation required for pauses"}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setSystemConfig((prev) => ({
                      ...prev,
                      autoPauseEnabled: !prev.autoPauseEnabled,
                    }))
                  }
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    systemConfig.autoPauseEnabled ? "bg-emerald-600" : "bg-slate-700"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                      systemConfig.autoPauseEnabled ? "left-7" : "left-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Latency Threshold */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-slate-300 font-bold">Latency SLA Threshold (ms):</label>
                <span className="font-mono-code font-bold text-cyan-400">
                  {systemConfig.latencyThresholdMs} ms
                </span>
              </div>
              <input
                type="range"
                min="100"
                max="1000"
                step="25"
                value={systemConfig.latencyThresholdMs}
                onChange={(e) =>
                  setSystemConfig((prev) => ({
                    ...prev,
                    latencyThresholdMs: Number(e.target.value),
                  }))
                }
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 block">
                Target: Sub-400ms SLA for mempool flash loan defense.
              </span>
            </div>

            {/* Loss Threshold */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <label className="text-slate-300 font-bold block">Min Potential Loss Trigger (USD):</label>
              <input
                type="number"
                value={systemConfig.lossThresholdUsd}
                onChange={(e) =>
                  setSystemConfig((prev) => ({
                    ...prev,
                    lossThresholdUsd: Number(e.target.value),
                  }))
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono-code focus:outline-none focus:border-indigo-500"
              />
              <span className="text-[10px] text-slate-500 block">
                Exploits exceeding ${(systemConfig.lossThresholdUsd / 1000000).toFixed(1)}M will trigger emergency relayer hooks.
              </span>
            </div>

            {/* Guardian Quorum */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <label className="text-slate-300 font-bold block">Guardian Multisig Quorum Ratio:</label>
              <select
                value={systemConfig.guardianQuorum}
                onChange={(e) =>
                  setSystemConfig((prev) => ({
                    ...prev,
                    guardianQuorum: e.target.value,
                  }))
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono-code focus:outline-none focus:border-indigo-500"
              >
                <option value="3-of-5">3-of-5 Quorum (Fast Fastpath)</option>
                <option value="4-of-7">4-of-7 Quorum (Standard High Security)</option>
                <option value="5-of-9">5-of-9 Quorum (Ultra-Consensus Institutional)</option>
              </select>
              <span className="text-[10px] text-slate-500 block">
                secp256k1 cryptographic signatures required from distributed SGX enclaves.
              </span>
            </div>

            {/* Relayer RPC */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 md:col-span-2">
              <label className="text-slate-300 font-bold block">Guardian Relayer Endpoint / RPC:</label>
              <input
                type="text"
                value={systemConfig.relayerRpc}
                onChange={(e) =>
                  setSystemConfig((prev) => ({
                    ...prev,
                    relayerRpc: e.target.value,
                  }))
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono-code focus:outline-none focus:border-indigo-500"
              />
              <span className="text-[10px] text-slate-500 block">
                Verified zero-custody flashbot private mempool bundle builder.
              </span>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 6: SERVER DIAGNOSTICS & STATUS */}
      {/* ========================================================================= */}
      {activeSubTab === "diagnostics" && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-emerald-400" />
              Main Server Diagnostics & Core Runtime Info
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Live container telemetry for the central Express + Vite server binding on port 3000.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono-code">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-slate-500 block text-[10px] uppercase">UPTIME & PROCESS</span>
              <div className="text-xl font-bold text-white">
                {serverStats ? `${Math.floor(serverStats.uptimeSeconds / 60)}m ${serverStats.uptimeSeconds % 60}s` : "4m 12s"}
              </div>
              <div className="text-slate-400">Node Runtime: {serverStats?.nodeVersion || "v22.x"}</div>
              <div className="text-emerald-400 font-bold">Status: HEALTHY & LISTENING</div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-slate-500 block text-[10px] uppercase">MEMORY USAGE</span>
              <div className="text-xl font-bold text-cyan-300">
                {serverStats?.memoryUsageMb.heapUsed || 42} MB / {serverStats?.memoryUsageMb.heapTotal || 78} MB
              </div>
              <div className="text-slate-400">RSS: {serverStats?.memoryUsageMb.rss || 85} MB</div>
              <div className="text-slate-500 text-[10px]">Zero leak state buffer</div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-slate-500 block text-[10px] uppercase">AI ENGINE INTEGRATION</span>
              <div className="text-xl font-bold text-indigo-400">
                gemini-3.8-flash
              </div>
              <div className="text-slate-400">{serverStats?.geminiStatus || "CONFIGURED (Live Key)"}</div>
              <div className="text-emerald-400 font-bold">Decompilation Ready</div>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 font-mono-code text-xs">
            <span className="text-slate-500 text-[10px] uppercase block">SERVER ENDPOINT REGISTRY</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-300 text-[11px]">
              <div><span className="text-emerald-400 font-bold">GET</span> /api/protocols - Tracked DeFi Matrix</div>
              <div><span className="text-cyan-400 font-bold">POST</span> /api/admin/protocols - Create Protocol</div>
              <div><span className="text-emerald-400 font-bold">GET</span> /api/threats/live - Mempool Stream</div>
              <div><span className="text-cyan-400 font-bold">POST</span> /api/admin/threats - Inject Incident</div>
              <div><span className="text-emerald-400 font-bold">GET</span> /api/admin/activities - Audit Stream</div>
              <div><span className="text-fuchsia-400 font-bold">POST</span> /api/threats/analyze - Gemini AI Audit</div>
              <div><span className="text-emerald-400 font-bold">GET</span> /api/admin/users - Operator Directory</div>
              <div><span className="text-rose-400 font-bold">POST</span> /api/admin/system/emergency-freeze - Killswitch</div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD PROTOCOL */}
      {/* ========================================================================= */}
      {isAddProtocolOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Register New Monitored Protocol</h3>
              <button
                onClick={() => setIsAddProtocolOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProtocol} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Protocol Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Compound V3 USDC"
                  value={newProtoName}
                  onChange={(e) => setNewProtoName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Category:</label>
                  <select
                    value={newProtoCategory}
                    onChange={(e) => setNewProtoCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Lending & Borrowing">Lending & Borrowing</option>
                    <option value="Automated Market Maker">Automated Market Maker</option>
                    <option value="Stableswap & LST Pool">Stableswap & LST Pool</option>
                    <option value="Cross-Chain Bridge">Cross-Chain Bridge</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Chain:</label>
                  <select
                    value={newProtoChain}
                    onChange={(e) => setNewProtoChain(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Ethereum Mainnet">Ethereum Mainnet</option>
                    <option value="Arbitrum One">Arbitrum One</option>
                    <option value="Base">Base</option>
                    <option value="Multi-Chain (EVM)">Multi-Chain (EVM)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">TVL (USD):</label>
                  <input
                    type="number"
                    value={newProtoTvl}
                    onChange={(e) => setNewProtoTvl(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Collateral at Risk ($):</label>
                  <input
                    type="number"
                    value={newProtoCar}
                    onChange={(e) => setNewProtoCar(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Health Score (0-100):</label>
                  <input
                    type="number"
                    value={newProtoHealth}
                    onChange={(e) => setNewProtoHealth(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Liq. Buffer (%):</label>
                  <input
                    type="number"
                    value={newProtoBuffer}
                    onChange={(e) => setNewProtoBuffer(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddProtocolOpen(false)}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  Add Protocol
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT PROTOCOL */}
      {/* ========================================================================= */}
      {editingProtocol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Edit {editingProtocol.name}</h3>
              <button
                onClick={() => setEditingProtocol(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProtocol} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Health Score (0-100):</label>
                <input
                  type="number"
                  value={editingProtocol.healthScore}
                  onChange={(e) =>
                    setEditingProtocol({
                      ...editingProtocol,
                      healthScore: Number(e.target.value),
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Collateral at Risk (USD):</label>
                <input
                  type="number"
                  value={editingProtocol.collateralAtRiskUsd}
                  onChange={(e) =>
                    setEditingProtocol({
                      ...editingProtocol,
                      collateralAtRiskUsd: Number(e.target.value),
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Status:</label>
                <select
                  value={editingProtocol.status}
                  onChange={(e) =>
                    setEditingProtocol({
                      ...editingProtocol,
                      status: e.target.value as any,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="HEALTHY">HEALTHY</option>
                  <option value="ELEVATED_RISK">ELEVATED_RISK</option>
                  <option value="HIGH_MONITORING">HIGH_MONITORING</option>
                  <option value="CRITICAL_DEFICIT">CRITICAL_DEFICIT (PAUSED)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingProtocol(null)}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD THREAT */}
      {/* ========================================================================= */}
      {isAddThreatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Inject Threat Incident</h3>
              <button
                onClick={() => setIsAddThreatOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateThreat} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Target Protocol:</label>
                <select
                  value={newThreatProto}
                  onChange={(e) => setNewThreatProto(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                >
                  {protocols.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Attack Vector / Threat Type:</label>
                <select
                  value={newThreatType}
                  onChange={(e) => setNewThreatType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Flash Loan Arbitrage & Oracle Skew">Flash Loan Arbitrage & Oracle Skew</option>
                  <option value="Reentrancy Liquidity Drain">Reentrancy Liquidity Drain</option>
                  <option value="Unauthorized Timelock Bypass / Admin Upgrade">
                    Unauthorized Timelock Bypass / Admin Upgrade
                  </option>
                  <option value="Bridge Balance Desync">Bridge Balance Desync</option>
                  <option value="Sandwich Attack & Liquidity Extraction">
                    Sandwich Attack & Liquidity Extraction
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Severity:</label>
                  <select
                    value={newThreatSeverity}
                    onChange={(e) => setNewThreatSeverity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Potential Loss ($):</label>
                  <input
                    type="number"
                    value={newThreatLoss}
                    onChange={(e) => setNewThreatLoss(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Threat Details:</label>
                <textarea
                  value={newThreatDetails}
                  onChange={(e) => setNewThreatDetails(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddThreatOpen(false)}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold"
                >
                  Inject Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD OPERATOR / USER */}
      {/* ========================================================================= */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Register New Guardian / Operator</h3>
              <button
                onClick={() => setIsAddUserOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Full Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Alex Rivera (Guardian)"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Email Address:</label>
                <input
                  type="email"
                  placeholder="operator@enclave.io"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Role:</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="GUARDIAN_OPERATOR">GUARDIAN_OPERATOR</option>
                    <option value="PROTOCOL_AUDITOR">PROTOCOL_AUDITOR</option>
                    <option value="RISK_ANALYST">RISK_ANALYST</option>
                    <option value="EXTERNAL_AGENT">EXTERNAL_AGENT</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Location / Node:</label>
                  <input
                    type="text"
                    value={newUserLocation}
                    onChange={(e) => setNewUserLocation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Wallet Address (0x...):</label>
                <input
                  type="text"
                  placeholder="0x9e4F2b318Da90117bBc981A721590F8e312A12dA"
                  value={newUserWallet}
                  onChange={(e) => setNewUserWallet(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono-code focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  Register Operator
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT OPERATOR */}
      {/* ========================================================================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Edit Operator: {editingUser.name}</h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Role:</label>
                <select
                  value={editingUser.role}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, role: e.target.value as any })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  <option value="GUARDIAN_OPERATOR">GUARDIAN_OPERATOR</option>
                  <option value="PROTOCOL_AUDITOR">PROTOCOL_AUDITOR</option>
                  <option value="RISK_ANALYST">RISK_ANALYST</option>
                  <option value="EXTERNAL_AGENT">EXTERNAL_AGENT</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Status:</label>
                <select
                  value={editingUser.status}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, status: e.target.value as any })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="ONLINE">ONLINE</option>
                  <option value="IDLE">IDLE</option>
                  <option value="OFFLINE">OFFLINE</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Signer Wallet:</label>
                <input
                  type="text"
                  value={editingUser.walletAddress}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, walletAddress: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono-code focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: INSPECT ACTIVITY */}
      {/* ========================================================================= */}
      {inspectingActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Audit Event Inspection: {inspectingActivity.id}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono-code">
                    {inspectingActivity.timestamp}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectingActivity(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono-code">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px]">OPERATOR / USER:</span>
                <span className="text-white font-semibold">{inspectingActivity.userName}</span>
                <span className="text-slate-400 block text-[11px]">
                  {inspectingActivity.userEmail}
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px]">ROLE & PRIVILEGE:</span>
                <div className="mt-1">{renderRoleBadge(inspectingActivity.userRole)}</div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px]">ACTION / CATEGORY:</span>
                <span className="text-cyan-300 font-semibold">{inspectingActivity.action}</span>
                <span className="text-slate-400 block text-[10px] mt-1">
                  {inspectingActivity.actionCategory}
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px]">TARGET CONTRACT / RESOURCE:</span>
                <span className="text-amber-300 font-semibold">
                  {inspectingActivity.targetResource}
                </span>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-1.5">
              <span className="text-slate-500 font-mono-code block text-[10px]">
                OPERATIONAL DESCRIPTION:
              </span>
              <p className="text-slate-200 leading-relaxed">{inspectingActivity.details}</p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs font-mono-code space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">IP Origin:</span>
                <span className="text-slate-300">{inspectingActivity.ipAddress}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Client Agent:</span>
                <span className="text-slate-400 truncate max-w-[280px]">
                  {inspectingActivity.userAgent}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Processing Latency:</span>
                <span className="text-cyan-400 font-bold">{inspectingActivity.latencyMs || 42}ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Anomaly Status:</span>
                <span>{renderStatusBadge(inspectingActivity.status, inspectingActivity.isAnomaly)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                onClick={() => handleToggleFlag(inspectingActivity)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                  inspectingActivity.isAnomaly
                    ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    : "bg-rose-600/20 text-rose-300 border border-rose-500/40 hover:bg-rose-600/30"
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>
                  {inspectingActivity.isAnomaly
                    ? "Clear Anomaly Flag"
                    : "Flag as Suspicious Activity"}
                </span>
              </button>

              <button
                onClick={() => setInspectingActivity(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SIMULATE ACTION */}
      {/* ========================================================================= */}
      {isSimulateActionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Simulate User / Operator Action</h3>
                  <p className="text-xs text-slate-400">Inject an operational log to verify real-time monitoring</p>
                </div>
              </div>
              <button
                onClick={() => setIsSimulateActionOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSimulatedAction} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Acting User / Operator:</label>
                <select
                  value={simUser}
                  onChange={(e) => setSimUser(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Action Title:</label>
                <input
                  type="text"
                  value={simAction}
                  onChange={(e) => setSimAction(e.target.value)}
                  placeholder="e.g. Injected Flash Loan Canary Probe"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Category:</label>
                  <select
                    value={simCategory}
                    onChange={(e) => setSimCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="MONITORING">MONITORING</option>
                    <option value="SECURITY_OVERRIDE">SECURITY_OVERRIDE</option>
                    <option value="EXPLOIT_SIMULATION">EXPLOIT_SIMULATION</option>
                    <option value="AI_AUDIT">AI_AUDIT</option>
                    <option value="CONFIGURATION">CONFIGURATION</option>
                    <option value="AUTHENTICATION">AUTHENTICATION</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Target Protocol / Resource:</label>
                  <input
                    type="text"
                    value={simTarget}
                    onChange={(e) => setSimTarget(e.target.value)}
                    placeholder="e.g. Curve 3pool"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Action Details / Audit Log:</label>
                <textarea
                  value={simDetails}
                  onChange={(e) => setSimDetails(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSimulateActionOpen(false)}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/30 cursor-pointer"
                >
                  Record to Audit Feed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
