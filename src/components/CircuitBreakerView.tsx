import React, { useState } from "react";
import {
  ShieldAlert,
  Zap,
  Lock,
  CheckCircle2,
  Clock,
  Send,
  Code,
  Key,
  Radio,
  FileCheck,
  AlertOctagon,
  Copy,
  Check
} from "lucide-react";
import { CircuitBreakerLog } from "../types";

interface CircuitBreakerViewProps {
  logs: CircuitBreakerLog[];
  onTriggerPause: (protocolName: string, reason?: string, actionType?: string) => void;
}

export const CircuitBreakerView: React.FC<CircuitBreakerViewProps> = ({
  logs,
  onTriggerPause,
}) => {
  const [selectedTarget, setSelectedTarget] = useState<string>("Aave V3 Core");
  const [pauseReason, setPauseReason] = useState<string>("Pre-execution Flash Loan Oracle Skew detected in mempool");
  const [actionType, setActionType] = useState<string>("EMERGENCY_GLOBAL_PAUSE");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const targets = [
    "Aave V3 Core",
    "GMX-Derivative Gateway",
    "Aerodrome Liquidity Router",
    "Curve 3pool & TriCrypto",
    "Morpho Blue Isolated Markets",
    "Omni Bridge Gateway",
    "Sky (MakerDAO / USDS)",
    "Ethena Synthetic Dollar (USDe)"
  ];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleManualExecute = () => {
    onTriggerPause(selectedTarget, pauseReason, actionType);
  };

  return (
    <div className="space-y-6">
      {/* Banner / PPT Core Capability 3 Header */}
      <div className="bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 border border-rose-500/30 rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded">
                CORE CAPABILITY 03
              </span>
              <span className="text-xs text-slate-400 font-mono-code">Sub-400ms Automated Emergency Dispatcher</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Circuit Breaker & Guardian Multisig Relay
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Automated emergency circuit-breaker webhooks and multisig pause triggers alerting protocol security
              guardians in <span className="text-rose-400 font-semibold">under 400ms</span>. Operates with complete
              zero-custody via cryptographically signed enclave attestations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-slate-900/90 border border-slate-800 px-4 py-2.5 rounded-lg text-right">
              <div className="text-[11px] text-slate-400">Guaranteed Execution SLA</div>
              <div className="text-xl font-bold font-mono-code text-rose-400">&lt; 400ms</div>
            </div>
          </div>
        </div>
      </div>

      {/* Relayer Node Network & Enclave Attestation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-semibold text-white">Safe Multisig Relay</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          </div>
          <div className="text-lg font-bold font-mono-code text-emerald-400">65ms Latency</div>
          <p className="text-[11px] text-slate-400">Direct integration with Safe Transaction Service & EIP-712</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-semibold text-white">Flashbots MEV-Protect</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          </div>
          <div className="text-lg font-bold font-mono-code text-cyan-400">38ms Latency</div>
          <p className="text-[11px] text-slate-400">Private builder bundle front-running exploiter txs</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-semibold text-white">Telegram & Discord Webhooks</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          </div>
          <div className="text-lg font-bold font-mono-code text-indigo-400">82ms Latency</div>
          <p className="text-[11px] text-slate-400">Automated paging to protocol Security Council members</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-semibold text-white">Zero-Custody Enclave</span>
            <Lock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-lg font-bold font-mono-code text-white">Secp256k1</div>
          <p className="text-[11px] text-slate-400">Attestation signatures prevent false-alarm griefing</p>
        </div>
      </div>

      {/* Trigger Interactive Panel & Payload Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trigger Panel */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <h3 className="font-bold text-white text-sm">Emergency Guardian Pause Dispatcher</h3>
          </div>
          <p className="text-xs text-slate-400">
            Transmit an attested emergency freeze signal to the target contract's guardian multisig.
          </p>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Target Protocol Vault:</label>
              <select
                value={selectedTarget}
                onChange={(e) => setSelectedTarget(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                {targets.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Action Type:</label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="EMERGENCY_GLOBAL_PAUSE">EMERGENCY_GLOBAL_PAUSE (Pause All Inflows/Outflows)</option>
                <option value="PAUSE_BORROW_AND_FLASH_LOAN">PAUSE_BORROW_AND_FLASH_LOAN (Disable Borrow Hook)</option>
                <option value="ISOLATE_COLLATERAL_MARKET">ISOLATE_COLLATERAL_MARKET (Freeze Manipulated Asset)</option>
                <option value="TIMELOCK_GUARDIAN_CANCEL">TIMELOCK_GUARDIAN_CANCEL (Revoke Pending Admin Upgrade)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Attested Trigger Reason:</label>
              <textarea
                rows={2}
                value={pauseReason}
                onChange={(e) => setPauseReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs"
              />
            </div>

            <button
              onClick={handleManualExecute}
              id="btn-broadcast-circuit-breaker"
              className="w-full py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-950/40 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              Broadcast Attested Circuit Breaker (&lt;400ms)
            </button>
          </div>
        </div>

        {/* EIP-712 & Enclave Attestation Payload Preview */}
        <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3 font-mono-code text-xs">
          <div className="flex items-center justify-between text-slate-400 border-b border-slate-800/80 pb-2">
            <span className="flex items-center gap-2 text-cyan-400 font-bold">
              <Code className="w-4 h-4" />
              Cryptographic Enclave Telemetry Attestation (EIP-712 Payload)
            </span>
            <span className="text-[11px] text-slate-500">Zero-Custody Compliant</span>
          </div>

          <div className="bg-slate-900/90 rounded-lg p-3 text-slate-300 text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
            <pre className="text-cyan-300">{`{
  "types": {
    "EIP712Domain": [
      { "name": "name", "type": "string" }, // "CyberWarrierGuardianRelay"
      { "name": "version", "type": "string" }, // "2026.1"
      { "name": "chainId", "type": "uint256" }  // 1 (Ethereum Mainnet)
    ],
    "CircuitBreakerProposal": [
      { "name": "protocol", "type": "string" }, // "${selectedTarget}"
      { "name": "action", "type": "string" },   // "${actionType}"
      { "name": "nonce", "type": "uint256" },
      { "name": "timestamp", "type": "uint256" } // ${Date.now()}
    ]
  },
  "attestationSignature": "0x7c9f81a...secp256k1_hardware_enclave_key",
  "guardianExecutionMode": "Flashbots Private Builder Mempool"
}`}</pre>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> Enclave Hardware Key verified by Protocol Multisig
            </span>
            <span className="text-slate-500">Anti-Griefing Bound: 2.5 ETH Slasher Stake</span>
          </div>
        </div>
      </div>

      {/* Historical Circuit Breaker Execution Logs */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-cyan-400" />
            Attested Circuit Breaker Execution Audit Trail
          </h3>
          <span className="text-xs font-mono-code text-slate-400">{logs.length} Executed Actions</span>
        </div>

        <div className="divide-y divide-slate-800 font-mono-code text-xs">
          {logs.map((log) => (
            <div key={log.id} className="p-4 hover:bg-slate-800/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white font-sans text-sm">{log.protocol}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800">
                    {log.action}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                    {log.status}
                  </span>
                </div>
                <div className="text-slate-400 text-[11px] mt-1">
                  Triggered by: <span className="text-slate-300 font-sans">{log.triggeredBy}</span>
                  <span className="mx-2 text-slate-600">·</span>
                  <span className="text-cyan-400 font-bold">Latency: {log.triggerLatencyMs}ms</span>
                </div>
                <div className="text-[10px] text-slate-500 truncate max-w-xl mt-0.5">
                  Attestation Sig: {log.attestationSignature}
                </div>
              </div>

              <div className="flex items-center gap-3 text-right">
                <div className="text-[11px] text-slate-500">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </div>
                <button
                  onClick={() => handleCopy(log.attestationSignature, log.id)}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                  title="Copy enclave signature"
                >
                  {copiedId === log.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
