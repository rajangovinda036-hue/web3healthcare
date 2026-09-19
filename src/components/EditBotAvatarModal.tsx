import React, { useState } from "react";
import { X, Bot, Sparkles, Check, RefreshCw, Shield, Link as LinkIcon } from "lucide-react";
import { CurrentUserSession } from "../types";

interface EditBotAvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: CurrentUserSession;
  onUpdateUser: (updatedUser: CurrentUserSession) => void;
}

const BOT_PRESETS = [
  {
    id: "sentinel-prime",
    name: "Sentinel Prime",
    category: "Master Enclave",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=GovindaSentinel&backgroundColor=0284c7"
  },
  {
    id: "cyber-guardian",
    name: "Cyber Guardian",
    category: "Threat Defense",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=CyberGuardian01&backgroundColor=0f172a"
  },
  {
    id: "neural-mech",
    name: "Neural Mech",
    category: "AI Auditor",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=NeuralMech99&backgroundColor=6366f1"
  },
  {
    id: "quantum-enclave",
    name: "Quantum Enclave",
    category: "Zero Custody",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=QuantumEnclave&backgroundColor=10b981"
  },
  {
    id: "iron-attestor",
    name: "Iron Attestor",
    category: "Consensus Node",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=IronAttestor&backgroundColor=8b5cf6"
  },
  {
    id: "zero-custody-droid",
    name: "Zero-Custody Droid",
    category: "Vault Guard",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=ZeroCustodyDroid&backgroundColor=d97706"
  },
  {
    id: "vortex-sentinel",
    name: "Vortex Sentinel",
    category: "Mempool Radar",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=VortexSentinel&backgroundColor=ec4899"
  },
  {
    id: "apex-cipher",
    name: "Apex Cipher",
    category: "Circuit Breaker",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=ApexCipher&backgroundColor=06b6d4"
  }
];

export const EditBotAvatarModal: React.FC<EditBotAvatarModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser
}) => {
  const [selectedAvatar, setSelectedAvatar] = useState<string>(currentUser.avatar);
  const [customSeed, setCustomSeed] = useState<string>("");
  const [customUrl, setCustomUrl] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>(currentUser.name);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"presets" | "custom_seed" | "custom_url">("presets");

  if (!isOpen) return null;

  const handleApplySeed = (seedText: string) => {
    setCustomSeed(seedText);
    const clean = seedText.trim().replace(/[^a-zA-Z0-9]/g, "") || "SentinelBot";
    const bg = currentUser.isAdmin ? "0284c7" : "0f172a";
    const generated = `https://api.dicebear.com/7.x/bottts/svg?seed=${clean}&backgroundColor=${bg}`;
    setSelectedAvatar(generated);
  };

  const handleApplyCustomUrl = (url: string) => {
    setCustomUrl(url);
    if (url.trim().startsWith("http")) {
      setSelectedAvatar(url.trim());
    }
  };

  const handleRandomize = () => {
    const randomSeeds = ["Titan77", "Aegis99", "Spectre", "Hyperion", "NexusCore", "OrionMesh", "Vanguard", "ZeroRisk"];
    const chosen = randomSeeds[Math.floor(Math.random() * randomSeeds.length)] + Math.floor(Math.random() * 900 + 100);
    handleApplySeed(chosen);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: currentUser.email,
          avatar: selectedAvatar,
          name: displayName
        })
      });
      const data = await res.json();
      if (data?.success && data?.user) {
        const updated: CurrentUserSession = {
          ...currentUser,
          avatar: data.user.avatar || selectedAvatar,
          name: data.user.name || displayName
        };
        onUpdateUser(updated);
        // Also update local storage session
        localStorage.setItem("sentinel_session", JSON.stringify(updated));
        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
          onClose();
        }, 800);
      } else {
        // Fallback update in state
        const fallback: CurrentUserSession = {
          ...currentUser,
          avatar: selectedAvatar,
          name: displayName
        };
        onUpdateUser(fallback);
        localStorage.setItem("sentinel_session", JSON.stringify(fallback));
        onClose();
      }
    } catch (err) {
      console.error("Failed to update bot avatar:", err);
      // Fallback local update
      const fallback: CurrentUserSession = {
        ...currentUser,
        avatar: selectedAvatar,
        name: displayName
      };
      onUpdateUser(fallback);
      localStorage.setItem("sentinel_session", JSON.stringify(fallback));
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="modal-edit-bot-avatar"
        className="w-full max-w-xl bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <span>Customize Bot Profile Avatar</span>
                {currentUser.isAdmin && (
                  <span className="text-[10px] px-2 py-0.5 rounded font-mono-code font-bold bg-fuchsia-950 text-fuchsia-300 border border-fuchsia-800">
                    MASTER ADMIN
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 font-mono-code">
                Personalize your Sentinel Bot avatar · Synchronizes across master node telemetry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            id="btn-close-bot-modal"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Current Avatar Highlight Box */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 flex items-center gap-4 relative overflow-hidden">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-slate-900 border-2 border-cyan-500/50 p-1 overflow-hidden shadow-lg shadow-cyan-500/10">
                <img
                  src={selectedAvatar}
                  alt="Bot Preview"
                  className="w-full h-full object-cover rounded-xl"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    // Fallback to default Sentinel bot on error
                    (e.target as HTMLImageElement).src =
                      "https://api.dicebear.com/7.x/bottts/svg?seed=GovindaSentinel&backgroundColor=0284c7";
                  }}
                />
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-slate-950 flex items-center justify-center">
                <Shield className="w-2.5 h-2.5 text-slate-950 stroke-[3]" />
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-xs text-cyan-400 font-mono-code uppercase font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Active Bot Identity</span>
              </div>
              <div className="font-bold text-white text-base truncate mt-0.5">
                {displayName || currentUser.name}
              </div>
              <div className="text-xs text-slate-400 font-mono-code truncate">
                {currentUser.email}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Role: <span className="text-slate-300 font-semibold">{currentUser.role}</span> · Latency SLA:{" "}
                <span className="text-emerald-400 font-mono-code font-bold">&lt;35ms</span>
              </div>
            </div>

            <button
              onClick={handleRandomize}
              id="btn-randomize-bot"
              type="button"
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              title="Generate a random unique robot"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Randomize</span>
            </button>
          </div>

          {/* Name Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Operator Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Govindarajan S"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 font-medium"
              id="input-bot-operator-name"
            />
          </div>

          {/* Avatar Source Tabs */}
          <div>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 mb-3 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("presets")}
                className={`flex-1 py-1.5 px-3 rounded-lg font-semibold transition-colors cursor-pointer ${
                  activeTab === "presets"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Curated Bot Presets
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("custom_seed")}
                className={`flex-1 py-1.5 px-3 rounded-lg font-semibold transition-colors cursor-pointer ${
                  activeTab === "custom_seed"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Morph with Seed
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("custom_url")}
                className={`flex-1 py-1.5 px-3 rounded-lg font-semibold transition-colors cursor-pointer ${
                  activeTab === "custom_url"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Custom URL
              </button>
            </div>

            {/* Tab 1: Presets */}
            {activeTab === "presets" && (
              <div className="grid grid-cols-4 gap-3">
                {BOT_PRESETS.map((preset) => {
                  const isSelected = selectedAvatar === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedAvatar(preset.url)}
                      className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer relative ${
                        isSelected
                          ? "bg-cyan-950/60 border-cyan-400 shadow-md shadow-cyan-500/20"
                          : "bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40"
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      )}
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-12 h-12 rounded-lg bg-slate-900 object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="text-[11px] font-semibold text-slate-200 truncate w-full">
                        {preset.name}
                      </div>
                      <div className="text-[9px] text-slate-400 font-mono-code truncate w-full">
                        {preset.category}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Tab 2: Custom Seed Input */}
            {activeTab === "custom_seed" && (
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="text-xs text-slate-300">
                  Type any word, your username, or a secret code to generate a unique algorithmic robot:
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customSeed}
                    onChange={(e) => handleApplySeed(e.target.value)}
                    placeholder="e.g. GovindaEnclave99"
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono-code"
                    id="input-bot-custom-seed"
                  />
                  <button
                    type="button"
                    onClick={handleRandomize}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-xs font-semibold text-slate-200 cursor-pointer"
                  >
                    Random
                  </button>
                </div>
                <div className="text-[11px] text-slate-400 font-mono-code">
                  Generated Bot Endpoint:{" "}
                  <span className="text-cyan-400 break-all">{selectedAvatar}</span>
                </div>
              </div>
            )}

            {/* Tab 3: Custom URL */}
            {activeTab === "custom_url" && (
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="text-xs text-slate-300">
                  Paste any direct HTTPS URL for your custom robot, avatar, or NFT visual:
                </div>
                <div className="relative">
                  <LinkIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={customUrl}
                    onChange={(e) => handleApplyCustomUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono-code"
                    id="input-bot-custom-url"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Ensure the image link is publicly accessible via HTTPS.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between">
          <div className="text-xs text-slate-400 font-mono-code">
            {saveSuccess ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                Bot profile photo updated!
              </span>
            ) : (
              <span>Photo changes apply immediately to live monitoring telemetry.</span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              id="btn-save-bot-avatar"
              className="px-5 py-2 rounded-lg text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Save Bot Photo</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
