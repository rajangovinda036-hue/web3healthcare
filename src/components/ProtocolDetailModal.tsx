import React from "react";
import {
  X,
  Activity,
  ShieldAlert,
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  DollarSign,
  TrendingDown
} from "lucide-react";
import { ProtocolHealth } from "../types";

interface ProtocolDetailModalProps {
  protocol: ProtocolHealth | null;
  isOpen: boolean;
  onClose: () => void;
  onTriggerPause: (protocolName: string) => void;
}

export const ProtocolDetailModal: React.FC<ProtocolDetailModalProps> = ({
  protocol,
  isOpen,
  onClose,
  onTriggerPause,
}) => {
  if (!isOpen || !protocol) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">{protocol.name}</h3>
              <span className="text-xs px-2 py-0.5 rounded font-mono-code font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
                Grade: {protocol.riskGrade}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-mono-code">
              {protocol.category} · {protocol.chain}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Core Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono-code">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Total TVL:</span>
            <span className="text-white font-bold text-base">
              ${(protocol.tvlUsd / 1_000_000_000).toFixed(2)}B
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-amber-400 block text-[10px]">Collateral At Risk:</span>
            <span className="text-amber-400 font-bold text-base">
              ${(protocol.collateralAtRiskUsd / 1_000_000).toFixed(1)}M
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Liq Buffer:</span>
            <span className="text-emerald-400 font-bold text-base">
              {protocol.liquidationBufferPct}%
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Entropy Score:</span>
            <span className="text-cyan-400 font-bold text-base">
              {protocol.liquidityEntropy} / 1.0
            </span>
          </div>
        </div>

        {/* Verified On-Chain Contract & Security Spec */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs border-b border-slate-800/80 pb-2">
            <span className="text-slate-400 font-medium">Verified Contract Target:</span>
            {protocol.contractAddress && (
              <a
                href={protocol.explorerUrl || `https://etherscan.io/address/${protocol.contractAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono-code text-cyan-400 hover:text-cyan-300 flex items-center gap-1 hover:underline"
              >
                <span>{protocol.contractAddress}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {protocol.guardianMultisig && (
            <div className="flex items-center justify-between text-xs border-b border-slate-800/80 pb-2">
              <span className="text-slate-400 font-medium">Guardian Multisig:</span>
              <span className="font-mono-code text-slate-300">{protocol.guardianMultisig}</span>
            </div>
          )}

          {protocol.auditFirms && protocol.auditFirms.length > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Security Audits:</span>
              <div className="flex flex-wrap gap-1.5 justify-end">
                {protocol.auditFirms.map((firm) => (
                  <span
                    key={firm}
                    className="px-2 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-700 text-slate-200 font-mono-code"
                  >
                    {firm}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Detailed Health Diagnostic Breakdown */}
        <div className="space-y-3 text-xs">
          <h4 className="font-bold text-white text-xs uppercase tracking-wider text-slate-400 font-mono-code">
            Multi-Dimensional Risk Breakdown
          </h4>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-slate-300">Collateral Liquidation Distance</span>
              <span className="text-emerald-400 font-mono-code font-bold">
                {protocol.liquidationBufferPct}% safety buffer before liquidations trigger
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-slate-300">Liquidity Concentration Entropy (Gini/Shannon)</span>
              <span className="text-cyan-400 font-mono-code font-bold">
                {(protocol.liquidityEntropy * 100).toFixed(0)}% Decentralized Distribution
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-slate-300">Cross-Chain Bridge Parity Check</span>
              <span className="text-emerald-400 font-mono-code font-bold">
                {protocol.bridgeBalanceSync}% Cryptographic Lockbox Match
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-300">Governance Timelock Delay</span>
              <span className="text-slate-300 font-mono-code font-bold">
                {protocol.governanceTimelockHours} Hours Required Notice
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={() => {
              onTriggerPause(protocol.name);
              onClose();
            }}
            className="px-4 py-2 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            Trigger Emergency Pause
          </button>
        </div>
      </div>
    </div>
  );
};
