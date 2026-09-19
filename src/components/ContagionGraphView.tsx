import React, { useState } from "react";
import { Layers, AlertTriangle, ArrowRight, ShieldAlert, Zap, Info, RotateCcw } from "lucide-react";
import { ContagionGraphData, ContagionNode } from "../types";

interface ContagionGraphViewProps {
  graphData: ContagionGraphData;
  onSelectNode?: (node: ContagionNode) => void;
  onTriggerPause: (protocolName: string) => void;
}

export const ContagionGraphView: React.FC<ContagionGraphViewProps> = ({
  graphData,
  onTriggerPause,
}) => {
  const [selectedNode, setSelectedNode] = useState<ContagionNode>(graphData.nodes[0]);
  const [stressFactor, setStressFactor] = useState<number>(0); // 0% to 30% simulated shock
  const [stressTarget, setStressTarget] = useState<string>("Lido"); // Target protocol for shock

  // Compute cascading impact based on stress factor
  const baseLossMillions = 480; // Lido default CaR
  const simulatedLossMillions = Math.round(baseLossMillions * (1 + (stressFactor / 100) * 3.5));
  const cascadeAffectedCount = stressFactor === 0 ? 1 : stressFactor > 15 ? 6 : 3;

  const getRiskColor = (risk: number, isAffected: boolean) => {
    if (isAffected && stressFactor > 0) return "#f43f5e"; // bright red
    if (risk > 45) return "#fb7185"; // rose
    if (risk > 30) return "#fbbf24"; // amber
    if (risk > 20) return "#38bdf8"; // cyan
    return "#34d399"; // emerald
  };

  return (
    <div className="space-y-6">
      {/* Banner / PPT Contagion Mapping Header */}
      <div className="bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 border border-purple-500/30 rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded">
                WHAT MAKES IT DIFFERENT
              </span>
              <span className="text-xs text-slate-400 font-mono-code">Systemic Cascades & Cross-Protocol Contagion</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Multi-Protocol Systemic Contagion Map
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Maps hidden liquidation cascades across collateral loops. Simulates how an anomalous state shock in one
              vault (e.g. stETH depeg or Curve pool drain) transmits risk across lending protocols, bridges, and CDOs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono-code text-cyan-400">
              8 Nodes · 10 Inter-Protocol Vectors
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Contagion Stress Test Sandbox */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Live Contagion Shock Simulator</h3>
            </div>
            <p className="text-xs text-slate-400">
              Inject a simulated price depeg or sudden liquidity drain to witness predictive cascade vectors
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Target Shock:</span>
              <select
                value={stressTarget}
                onChange={(e) => setStressTarget(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="Lido">Lido (stETH Depeg Shock)</option>
                <option value="Curve 3pool">Curve 3pool (USDT / Stable Drain)</option>
                <option value="Ethena USDe">Ethena USDe (Basis Spread Reversal)</option>
                <option value="Cross-Chain Bridges">Cross-Chain Bridges (Relay Halt)</option>
              </select>
            </div>

            <div className="flex items-center gap-2 min-w-[220px]">
              <span className="text-slate-400">Stress:</span>
              <input
                type="range"
                min="0"
                max="30"
                value={stressFactor}
                onChange={(e) => setStressFactor(Number(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer"
              />
              <span className="font-mono-code font-bold text-rose-400 min-w-[40px]">
                -{stressFactor}%
              </span>
            </div>

            {stressFactor > 0 && (
              <button
                onClick={() => setStressFactor(0)}
                className="flex items-center gap-1 text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            )}
          </div>
        </div>

        {stressFactor > 0 && (
          <div className="mt-3 p-3 bg-rose-950/30 border border-rose-900/50 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono-code">
            <div className="flex items-center gap-2 text-rose-300">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                Simulated shock on <strong className="text-white">{stressTarget}</strong> triggers cascade risk across{" "}
                <strong className="text-white">{cascadeAffectedCount} connected protocols</strong>.
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-400">Projected Liquidation CaR:</span>
              <span className="text-rose-400 font-bold text-sm">${simulatedLossMillions}M</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Contagion Interactive Canvas & Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SVG Network Graph Canvas */}
        <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-xl p-4 relative overflow-hidden flex flex-col items-center justify-center min-h-[460px]">
          <div className="absolute top-3 left-3 z-10 text-[11px] font-mono-code text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800">
            Interactive Dependency Graph · Click nodes to inspect exposure
          </div>

          <svg viewBox="0 0 850 580" className="w-full h-auto max-h-[500px]">
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="28"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
              </marker>
              <marker
                id="arrowhead-active"
                markerWidth="10"
                markerHeight="7"
                refX="28"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#f43f5e" />
              </marker>
            </defs>

            {/* Connecting Edges */}
            {graphData.edges.map((edge, idx) => {
              const source = graphData.nodes.find((n) => n.id === edge.from);
              const target = graphData.nodes.find((n) => n.id === edge.to);
              if (!source || !target) return null;

              const isConnectedToSelected = selectedNode && (source.id === selectedNode.id || target.id === selectedNode.id);
              const isCascadeActive = stressFactor > 0 && (source.id === stressTarget || target.id === stressTarget);

              return (
                <g key={idx}>
                  <line
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke={isCascadeActive ? "#f43f5e" : isConnectedToSelected ? "#38bdf8" : "#334155"}
                    strokeWidth={isCascadeActive ? 2.5 : isConnectedToSelected ? 2 : 1.2}
                    strokeDasharray={edge.riskTransmissibility === "Critical" ? "4 4" : "none"}
                    markerEnd={isCascadeActive ? "url(#arrowhead-active)" : "url(#arrowhead)"}
                    className={isCascadeActive ? "animate-pulse" : ""}
                  />
                  {/* Midpoint Label */}
                  <text
                    x={(source.x + target.x) / 2}
                    y={(source.y + target.y) / 2 - 5}
                    fill={isCascadeActive ? "#fda4af" : "#64748b"}
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="middle"
                    className="select-none pointer-events-none"
                  >
                    {edge.label}
                  </text>
                </g>
              );
            })}

            {/* Protocol Nodes */}
            {graphData.nodes.map((node) => {
              const isSelected = selectedNode?.id === node.id;
              const isStressTarget = stressFactor > 0 && node.id === stressTarget;
              const isAffected =
                stressFactor > 0 &&
                (isStressTarget ||
                  graphData.edges.some(
                    (e) =>
                      (e.from === stressTarget && e.to === node.id) ||
                      (e.to === stressTarget && e.from === node.id)
                  ));

              const nodeColor = getRiskColor(node.risk, isAffected);

              return (
                <g
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className="cursor-pointer transition-transform hover:scale-105"
                  transform={`translate(${node.x}, ${node.y})`}
                >
                  {/* Outer pulse ring for affected nodes */}
                  {(isAffected || isSelected) && (
                    <circle
                      r="32"
                      fill="none"
                      stroke={nodeColor}
                      strokeWidth="1.5"
                      strokeOpacity="0.6"
                      className="animate-ping"
                    />
                  )}

                  {/* Main Node Circle */}
                  <circle
                    r="24"
                    fill="#0f172a"
                    stroke={nodeColor}
                    strokeWidth={isSelected ? 3 : 2}
                    className="shadow-lg"
                  />

                  {/* Node Label */}
                  <text
                    y="4"
                    fill="#ffffff"
                    fontSize="10"
                    fontWeight="bold"
                    textAnchor="middle"
                    className="select-none pointer-events-none"
                  >
                    {node.id.split(" ")[0]}
                  </text>

                  {/* Category Pill under node */}
                  <text
                    y="36"
                    fill="#94a3b8"
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="middle"
                    className="select-none pointer-events-none"
                  >
                    {node.type} · {node.tvl}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Node Contagion Inspector */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono-code text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/40">
              Contagion Node Inspector
            </span>
            <span className="text-xs font-mono-code text-slate-400">{selectedNode.type}</span>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">{selectedNode.id}</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Mapped exposure and inter-protocol liquidation channels
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono-code">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-0.5">Protocol TVL:</span>
              <span className="text-white font-bold text-sm">{selectedNode.tvl}</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-[10px] text-amber-400 block mb-0.5">Collateral At Risk:</span>
              <span className="text-amber-400 font-bold text-sm">{selectedNode.collateralAtRisk}</span>
            </div>
          </div>

          {/* Direct Dependency Connections */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-300">Active Dependency Vectors:</div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {graphData.edges
                .filter((e) => e.from === selectedNode.id || e.to === selectedNode.id)
                .map((e, i) => {
                  const other = e.from === selectedNode.id ? e.to : e.from;
                  const direction = e.from === selectedNode.id ? "Outgoing Transmission" : "Incoming Dependency";
                  return (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono-code flex items-center justify-between"
                    >
                      <div>
                        <div className="text-slate-200 font-semibold">{other}</div>
                        <div className="text-[10px] text-slate-400">{e.label}</div>
                      </div>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          e.riskTransmissibility === "Critical"
                            ? "bg-rose-950 text-rose-400 border border-rose-800"
                            : "bg-slate-800 text-cyan-400"
                        }`}
                      >
                        {e.riskTransmissibility}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Guardian Pause Action for Node */}
          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => onTriggerPause(selectedNode.id)}
              className="w-full py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              Propose Guardian Pause for {selectedNode.id}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
