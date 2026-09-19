import React, { useState } from "react";
import {
  X,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Code,
  Copy,
  Check,
  Cpu,
  Terminal,
  FileText
} from "lucide-react";
import { ThreatEvent, AIAnalysisResult } from "../types";

interface AiAnalystModalProps {
  isOpen: boolean;
  onClose: () => void;
  threat: ThreatEvent | null;
  analysis: AIAnalysisResult | null;
  isLoading: boolean;
}

export const AiAnalystModal: React.FC<AiAnalystModalProps> = ({
  isOpen,
  onClose,
  threat,
  analysis,
  isLoading,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen || !threat) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl shadow-indigo-950/60 p-6 space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/40">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">AI Smart Contract Security Auditor</h3>
                <span className="text-[10px] font-mono-code px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                  {analysis?.modelUsed || "gemini-3.8-flash"}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Automated root cause decomposition and Solidity circuit-breaker generation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Threat Snapshot */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono-code">
          <div>
            <span className="text-slate-400 block text-[10px]">Target Protocol:</span>
            <span className="text-white font-bold font-sans text-sm">{threat.protocol}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Threat Vector:</span>
            <span className="text-cyan-400 font-semibold">{threat.threatType}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Capital At Risk:</span>
            <span className="text-rose-400 font-bold">${(threat.potentialLossUsd / 1_000_000).toFixed(1)}M</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Detection Latency:</span>
            <span className="text-emerald-400 font-bold">{threat.detectionLatencyMs}ms (Pre-Exec)</span>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <Cpu className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
            <div className="text-sm font-semibold text-white">
              Decompiling Mempool Bytecode & Synthesizing Security Proof...
            </div>
            <p className="text-xs text-slate-400 font-mono-code">
              Gemini Security Auditor analyzing storage slots and flash loan invariants
            </p>
          </div>
        ) : analysis ? (
          <div className="space-y-5 text-xs leading-relaxed">
            {/* 1. Root Cause */}
            <div className="space-y-1.5">
              <h4 className="font-bold text-white flex items-center gap-1.5 text-xs text-indigo-300">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                1. Technical Vulnerability Root Cause
              </h4>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-slate-300 leading-relaxed">
                {analysis.rootCause}
              </div>
            </div>

            {/* 2. Step-by-Step Exploit Breakdown */}
            <div className="space-y-2">
              <h4 className="font-bold text-white flex items-center gap-1.5 text-xs text-indigo-300">
                <Terminal className="w-4 h-4 text-cyan-400" />
                2. Exploit Vector Execution Breakdown
              </h4>
              <div className="space-y-1.5">
                {analysis.exploitVectorBreakdown.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 font-mono-code text-[11px] text-slate-300"
                  >
                    {step}
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Actionable Mitigation Recommendation */}
            <div className="space-y-1.5">
              <h4 className="font-bold text-white flex items-center gap-1.5 text-xs text-indigo-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                3. Guardian Council Mitigation Directive
              </h4>
              <div className="bg-emerald-950/20 border border-emerald-900/50 p-3.5 rounded-xl text-emerald-200">
                {analysis.mitigationRecommendation}
              </div>
            </div>

            {/* 4. Solidity Circuit-Breaker Guard Snippet */}
            {analysis.solidityCountermeasure && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white flex items-center gap-1.5 text-xs text-indigo-300">
                    <Code className="w-4 h-4 text-cyan-400" />
                    4. Auto-Generated Solidity Circuit-Breaker Guard
                  </h4>
                  <button
                    onClick={() => handleCopy(analysis.solidityCountermeasure)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono-code text-[11px] transition-colors cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? "Copied" : "Copy Code"}</span>
                  </button>
                </div>
                <div className="bg-slate-950 rounded-xl p-3.5 border border-slate-800 font-mono-code text-[11px] text-cyan-300 overflow-x-auto leading-relaxed">
                  <pre>{analysis.solidityCountermeasure}</pre>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};
