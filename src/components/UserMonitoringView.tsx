import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  Search,
  RefreshCw,
  Globe,
  Radio,
  Clock,
  Shield,
  Zap,
  Activity,
  UserPlus,
  Wifi,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Send,
  Eye,
  Terminal,
  Filter,
  Bot,
  Edit3,
  Lock,
  UserX,
  Trash2,
  LogOut
} from "lucide-react";
import { MonitoredUser, CurrentUserSession } from "../types";
import { EditBotAvatarModal } from "./EditBotAvatarModal";

interface UserMonitoringViewProps {
  currentUser: CurrentUserSession;
  onNavigateToView?: (tab: string) => void;
  onUpdateCurrentUser?: (user: CurrentUserSession) => void;
  onLogout?: () => void;
}

interface UserActivityItem {
  id: string;
  userName: string;
  userEmail: string;
  userRole: string;
  action: string;
  actionCategory: string;
  targetResource: string;
  details: string;
  ipAddress: string;
  status: string;
  timestamp: string;
  latencyMs?: number;
  isAnomaly?: boolean;
}

interface GeoNodeItem {
  location: string;
  count: number;
  status: string;
  region?: string;
}

export const UserMonitoringView: React.FC<UserMonitoringViewProps> = ({
  currentUser,
  onNavigateToView,
  onUpdateCurrentUser,
  onLogout
}) => {
  const [users, setUsers] = useState<MonitoredUser[]>([]);
  const [activities, setActivities] = useState<UserActivityItem[]>([]);
  const [geoNodes, setGeoNodes] = useState<GeoNodeItem[]>([]);
  const [metrics, setMetrics] = useState({
    totalConnected: 0,
    activeOnline: 0,
    idleCount: 0,
    peakConcurrent24h: 46,
    avgLatencyMs: 34,
    mempoolSubscribers: 14,
    systemHealth: "99.98%"
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [pingingUserId, setPingingUserId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [selectedUserDetail, setSelectedUserDetail] = useState<MonitoredUser | null>(null);
  const [isEditAvatarModalOpen, setIsEditAvatarModalOpen] = useState<boolean>(false);

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  const fetchMonitoringData = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/users/monitoring?search=${encodeURIComponent(searchQuery)}&status=${statusFilter}&role=${roleFilter}`, {
        headers: {
          "x-user-email": currentUser.email
        }
      });
      const data = await res.json();
      if (data?.users) {
        setUsers(data.users);
      }
      if (data?.metrics) {
        setMetrics(data.metrics);
      }
      if (data?.geoNodes) {
        setGeoNodes(data.geoNodes);
      }
      if (data?.liveActivityStream) {
        setActivities(data.liveActivityStream);
      }
    } catch (err) {
      console.error("Failed to load user monitoring telemetry:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();
    const interval = setInterval(fetchMonitoringData, 10000);
    return () => clearInterval(interval);
  }, [searchQuery, statusFilter, roleFilter, currentUser.email]);

  // Ping a user node to test latency
  const handlePingUser = async (userId: string, userName: string) => {
    setPingingUserId(userId);
    try {
      const res = await fetch("/api/users/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      if (data?.latencyMs) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, latencyMs: data.latencyMs, lastActive: "Just now" } : u))
        );
        showFeedback(`Ping response from ${userName}: ${data.latencyMs}ms roundtrip`);
      }
    } catch (err) {
      console.error("Ping error:", err);
    } finally {
      setPingingUserId(null);
    }
  };

  // Purge all users except rajangovinda036@gmail.com
  const handlePurgeAllOtherUsers = async () => {
    try {
      const res = await fetch("/api/users/purge-all-except-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      fetchMonitoringData();
      showFeedback(data.message || "All other users successfully deleted. Sole operator retained.");
    } catch (err) {
      console.error("Purge error:", err);
      showFeedback("Purge command executed.");
    }
  };

  // Delete a specific user node
  const handleDeleteSingleUser = async (userId: string, userName: string) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      fetchMonitoringData();
      showFeedback(data.message || `Deleted user ${userName}`);
    } catch (err) {
      console.error("Delete user error:", err);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (statusFilter !== "ALL" && u.status !== statusFilter) return false;
      if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.ipLocation.toLowerCase().includes(q) ||
          (u.currentView && u.currentView.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [users, statusFilter, roleFilter, searchQuery]);

  const renderRoleBadge = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-fuchsia-950/60 text-fuchsia-300 border border-fuchsia-800/60">
            {currentUser.isAdmin ? "SUPER ADMIN" : "OPERATOR"}
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
            WATCHER BOT
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-medium bg-slate-800 text-slate-300 border border-slate-700">
            STANDARD USER
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedbackMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-cyan-500/50 text-white text-xs font-semibold shadow-2xl shadow-cyan-500/20 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Header Block: User Monitoring Center */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-600/30 to-blue-600/30 text-cyan-400 border border-cyan-500/40">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-wide">
                Active Users & Session Monitoring Block
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono-code font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Live Telemetry
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Dedicated observation block tracking connected operators, user viewing states, geographic distribution, and interactive node latency.
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <button
            onClick={() => setIsEditAvatarModalOpen(true)}
            id="btn-monitoring-edit-bot"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/40 transition-colors cursor-pointer"
            title="Customize your personal bot avatar photo"
          >
            <Bot className="w-3.5 h-3.5 text-indigo-400" />
            <span>Edit My Bot Photo</span>
          </button>

          <button
            onClick={handlePurgeAllOtherUsers}
            id="btn-purge-other-users"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 transition-colors cursor-pointer"
            title="Purge all users except rajangovinda036@gmail.com"
          >
            <UserX className="w-3.5 h-3.5 text-rose-400" />
            <span>Delete All Other Users</span>
          </button>

          <button
            onClick={fetchMonitoringData}
            disabled={isRefreshing}
            id="btn-refresh-user-monitoring"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-cyan-400" : ""}`} />
            <span>Refresh</span>
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              id="btn-monitoring-logout"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 hover:border-rose-600 transition-colors cursor-pointer"
              title="Log out of master enclave"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Log Out</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Connected Users</span>
            <Users className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono-code">
            {metrics.totalConnected}
          </div>
          <div className="text-[10px] text-cyan-400/90 font-mono-code mt-0.5">
            Active session nodes
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Online Now</span>
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 font-mono-code">
            {metrics.activeOnline}
          </div>
          <div className="text-[10px] text-slate-500 font-mono-code mt-0.5">
            {metrics.idleCount} idle in background
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Peak 24h</span>
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono-code">
            {metrics.peakConcurrent24h}
          </div>
          <div className="text-[10px] text-indigo-400/90 font-mono-code mt-0.5">
            Concurrent watchers
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Avg Node Latency</span>
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 font-mono-code">
            {metrics.avgLatencyMs}ms
          </div>
          <div className="text-[10px] text-emerald-400/90 font-mono-code mt-0.5">
            P99 SLA &lt;400ms target
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Geo Relay Hubs</span>
            <Globe className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono-code">
            {geoNodes.length}
          </div>
          <div className="text-[10px] text-amber-400/90 font-mono-code mt-0.5">
            Global network distribution
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>System Health</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-cyan-300 font-mono-code">
            {metrics.systemHealth}
          </div>
          <div className="text-[10px] text-slate-500 font-mono-code mt-0.5">
            Zero dropped handshakes
          </div>
        </div>
      </div>

      {/* Main Content Layout: Grid of Users + Geographic Distribution & Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Monitored Users List & Table (2 Cols on lg) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter users by name, email, location, current view..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                  id="input-filter-monitored-users"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs">
                  <span className="text-slate-500 px-1.5 text-[11px] font-mono-code">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-transparent text-slate-300 focus:outline-none cursor-pointer pr-2 font-medium"
                    id="select-user-status"
                  >
                    <option value="ALL" className="bg-slate-900">All</option>
                    <option value="ONLINE" className="bg-slate-900">Online</option>
                    <option value="IDLE" className="bg-slate-900">Idle</option>
                    <option value="OFFLINE" className="bg-slate-900">Offline</option>
                  </select>
                </div>

                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs">
                  <span className="text-slate-500 px-1.5 text-[11px] font-mono-code">Role:</span>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="bg-transparent text-slate-300 focus:outline-none cursor-pointer pr-2 font-medium"
                    id="select-user-role"
                  >
                    <option value="ALL" className="bg-slate-900">All Roles</option>
                    <option value="STANDARD_USER" className="bg-slate-900">Standard Users</option>
                    <option value="PROTOCOL_AUDITOR" className="bg-slate-900">Auditors</option>
                    <option value="RISK_ANALYST" className="bg-slate-900">Analysts</option>
                    <option value="GUARDIAN_OPERATOR" className="bg-slate-900">Guardians</option>
                    <option value="EXTERNAL_AGENT" className="bg-slate-900">Bots / Agents</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-800/80">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-mono-code text-[11px]">
                    <th className="py-2.5 px-3">User & Node Identity</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Location & Region</th>
                    <th className="py-2.5 px-3">Current View</th>
                    <th className="py-2.5 px-3">Latency</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-2">
                          <Users className="w-8 h-8 text-slate-600 mb-1" />
                          <div className="text-sm font-semibold text-slate-300">Single Operator Enclave Active</div>
                          <p className="text-xs text-slate-500">
                            All external users have been deleted. Log in as <span className="text-cyan-400 font-mono-code">rajangovinda036@gmail.com</span> to inspect the master console.
                          </p>
                          <button
                            onClick={handlePurgeAllOtherUsers}
                            className="mt-2 text-xs px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 cursor-pointer font-medium flex items-center gap-1.5"
                          >
                            <UserX className="w-3.5 h-3.5 text-rose-400" />
                            <span>Confirm Purge of All Other Users</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const isPinging = pingingUserId === user.id;
                      const isMasterAdmin = user.email.toLowerCase() === "rajangovinda036@gmail.com";
                      return (
                        <tr
                          key={user.id}
                          className="hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className="relative">
                                <img
                                  src={user.avatar}
                                  alt={user.name}
                                  className="w-8 h-8 rounded-full object-cover border border-slate-700"
                                  referrerPolicy="no-referrer"
                                />
                                <span
                                  className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0a0e17] ${
                                    user.status === "ONLINE"
                                      ? "bg-emerald-400"
                                      : user.status === "IDLE"
                                      ? "bg-amber-400"
                                      : "bg-slate-600"
                                  }`}
                                />
                              </div>
                              <div>
                                <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                                  <span>{user.name}</span>
                                  {isMasterAdmin && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono-code font-bold">
                                      SOLE ADMIN
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono-code">
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {renderRoleBadge(user.role)}
                          </td>

                          <td className="py-2.5 px-3 whitespace-nowrap text-slate-300 font-medium">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                              <span>{user.ipLocation}</span>
                            </div>
                          </td>

                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-slate-950 border border-slate-800 text-slate-300 font-mono-code">
                              <Eye className="w-3 h-3 text-slate-500" />
                              {user.currentView || "Mempool Radar"}
                            </span>
                          </td>

                          <td className="py-2.5 px-3 whitespace-nowrap font-mono-code">
                            <span
                              className={`text-[11px] font-bold ${
                                (user.latencyMs || 40) < 60
                                  ? "text-emerald-400"
                                  : (user.latencyMs || 40) < 150
                                  ? "text-amber-400"
                                  : "text-rose-400"
                              }`}
                            >
                              {user.latencyMs || 42}ms
                            </span>
                          </td>

                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handlePingUser(user.id, user.name)}
                                disabled={isPinging}
                                className="px-2.5 py-1 rounded text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer inline-flex items-center gap-1"
                                title="Send real-time latency ping to this node"
                              >
                                <Wifi className={`w-3 h-3 ${isPinging ? "animate-spin text-cyan-400" : "text-cyan-400"}`} />
                                <span>{isPinging ? "..." : "Ping"}</span>
                              </button>

                              {isMasterAdmin && onLogout && (
                                <button
                                  onClick={onLogout}
                                  className="px-2.5 py-1 rounded text-[11px] font-semibold bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 transition-all cursor-pointer inline-flex items-center gap-1"
                                  title="Log out active master session"
                                >
                                  <LogOut className="w-3 h-3 text-rose-400" />
                                  <span>Log Out</span>
                                </button>
                              )}

                              {!isMasterAdmin && (
                                <button
                                  onClick={() => handleDeleteSingleUser(user.id, user.name)}
                                  className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-950/60 border border-rose-900/60 transition-all cursor-pointer"
                                  title={`Delete user ${user.name}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Geographic Relays & Live Activity Feed */}
        <div className="space-y-4">
          {/* Geographic Distribution Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono-code">
                  Geographic Relay Distribution
                </h3>
              </div>
              <span className="text-[10px] text-slate-500 font-mono-code">
                {geoNodes.length} Active Regions
              </span>
            </div>

            <div className="space-y-2">
              {geoNodes.map((node, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        node.status === "ONLINE"
                          ? "bg-emerald-400"
                          : node.status === "FLAGGED"
                          ? "bg-rose-400 animate-pulse"
                          : "bg-amber-400"
                      }`}
                    />
                    <span className="text-slate-300 font-medium">{node.location}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono-code text-[11px]">
                    <span className="text-slate-500">{node.region || "Relay"}</span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300 font-bold">
                      {node.count} node{node.count > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live User Activity Stream Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono-code">
                  Live User Activity Stream
                </h3>
              </div>
              <span className="text-[10px] text-slate-500 font-mono-code">
                Chronological
              </span>
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {activities.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">
                  No recent activities recorded yet.
                </div>
              ) : (
                activities.slice(0, 10).map((act) => (
                  <div
                    key={act.id}
                    className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-200">{act.userName}</span>
                        <span className="text-slate-500">·</span>
                        <span className="text-[10px] text-slate-400 font-mono-code">
                          {act.userRole.replace("_", " ")}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono-code">
                        {act.timestamp ? new Date(act.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "just now"}
                      </span>
                    </div>

                    <div className="text-slate-300 font-medium">
                      {act.action}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono-code pt-0.5">
                      <span className="text-cyan-400/90 truncate max-w-[170px]">
                        Target: {act.targetResource}
                      </span>
                      <span
                        className={`font-bold ${
                          act.status === "SUCCESS"
                            ? "text-emerald-400"
                            : act.status === "FLAGGED"
                            ? "text-rose-400"
                            : "text-amber-400"
                        }`}
                      >
                        {act.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Bot Avatar Modal */}
      <EditBotAvatarModal
        isOpen={isEditAvatarModalOpen}
        onClose={() => setIsEditAvatarModalOpen(false)}
        currentUser={currentUser}
        onUpdateUser={(updated) => {
          onUpdateCurrentUser?.(updated);
          showFeedback("Bot profile photo updated!");
          fetchMonitoringData();
        }}
      />
    </div>
  );
};
