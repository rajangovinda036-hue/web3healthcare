import React, { useState } from "react";
import {
  Activity,
  ShieldCheck,
  AlertTriangle,
  Layers,
  ArrowUpRight,
  Sliders,
  DollarSign,
  TrendingDown,
  Info,
  Clock,
  CheckCircle,
  ExternalLink
} from "lucide-react";
import { ProtocolHealth } from "../types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend
} from "recharts";

interface ProtocolHealthMatrixProps {
  protocols: ProtocolHealth[];
  onSelectProtocol: (protocol: ProtocolHealth) => void;
  onTriggerPause: (protocolName: string) => void;
}

export const ProtocolHealthMatrix: React.FC<ProtocolHealthMatrixProps> = ({
  protocols,
  onSelectProtocol,
  onTriggerPause,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [sortField, setSortField] = useState<"healthScore" | "collateralAtRiskUsd" | "tvlUsd">("collateralAtRiskUsd");
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const categories = ["ALL", "Lending & Borrowing", "Liquid Staking Token", "Stableswap & LST Pool", "Automated Market Maker", "CDO / Stablecoin Engine", "Basis Trading / Delta-Neutral", "Cross-Chain Message Passing"];

  const filteredProtocols = protocols
    .filter((p) => (selectedCategory === "ALL" ? true : p.category === selectedCategory))
    .sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      return sortAsc ? valA - valB : valB - valA;
    });

  const totalTvl = protocols.reduce((acc, p) => acc + p.tvlUsd, 0);
  const totalCaR = protocols.reduce((acc, p) => acc + p.collateralAtRiskUsd, 0);
  const avgHealth = Math.round(protocols.reduce((acc, p) => acc + p.healthScore, 0) / protocols.length);

  // Chart data formatting
  const chartData = protocols.map((p) => ({
    name: p.name.split(" ")[0],
    tvlBillions: parseFloat((p.tvlUsd / 1_000_000_000).toFixed(2)),
    carMillions: parseFloat((p.collateralAtRiskUsd / 1_000_000).toFixed(1)),
    healthScore: p.healthScore,
    grade: p.riskGrade
  }));

  const getGradeColor = (grade: string) => {
    if (grade.startsWith("A")) return "text-emerald-400 bg-emerald-950/80 border-emerald-800";
    if (grade.startsWith("B")) return "text-cyan-400 bg-cyan-950/80 border-cyan-800";
    if (grade.startsWith("C")) return "text-amber-400 bg-amber-950/80 border-amber-800";
    return "text-rose-400 bg-rose-950/80 border-rose-800";
  };

  return (
    <div className="space-y-6">
      {/* Banner / PPT Core Feature 2 Header */}
      <div className="bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-900 border border-blue-500/30 rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/40 rounded">
                CORE CAPABILITY 02
              </span>
              <span className="text-xs text-slate-400 font-mono-code">Composite Solvency & Collateral At Risk</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Multi-Dimensional Protocol Health Matrix
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Real solvency analysis beyond superficial vanity metrics. Evaluating{" "}
              <span className="text-cyan-400 font-semibold">Collateral At Risk (CaR)</span>, liquidity concentration
              entropy, bridge balance verifications, and governance timelock audit delays.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-900/90 border border-slate-800 px-4 py-2.5 rounded-lg text-right">
              <div className="text-[11px] text-slate-400">Systemic Health Index</div>
              <div className="text-xl font-bold font-mono-code text-cyan-400">{avgHealth}/100</div>
            </div>
          </div>
        </div>
      </div>

      {/* Aggregate Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Total Tracked TVL</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono-code">
            ${(totalTvl / 1_000_000_000).toFixed(1)}B
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Across 8 blue-chip protocols & DEXes
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Total Collateral At Risk (CaR)</span>
            <TrendingDown className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono-code">
            ${(totalCaR / 1_000_000).toFixed(1)}M
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {((totalCaR / totalTvl) * 100).toFixed(2)}% of aggregate protocol TVL
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Liquidity Concentration Entropy</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-400 font-mono-code">
            0.79 <span className="text-xs text-slate-400 font-normal">/ 1.0</span>
          </div>
          <p className="text-[11px] text-emerald-400 mt-1">
            Moderate-to-high capital decentralization
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Cross-Chain Bridge Sync</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono-code">
            99.2%
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Cryptographic reserve parity verified
          </p>
        </div>
      </div>

      {/* Visual Chart: Collateral At Risk (CaR) vs TVL */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Collateral At Risk (CaR in $M) vs Health Score by Protocol
            </h3>
            <p className="text-xs text-slate-400">
              Surfaces insolvency risk vectors obscured by raw TVL vanity metrics
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono-code">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-amber-500"></span>
              <span className="text-slate-300">Collateral At Risk ($M)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-cyan-500"></span>
              <span className="text-slate-300">Health Score</span>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: any, name?: any) => [
                  name === "carMillions" ? `$${value}M` : value,
                  name === "carMillions" ? "Collateral At Risk" : "Health Score"
                ]}
              />
              <Bar dataKey="carMillions" fill="#f59e0b" radius={[4, 4, 0, 0]} name="carMillions" />
              <Bar dataKey="healthScore" fill="#06b6d4" radius={[4, 4, 0, 0]} name="healthScore" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Filter & Sort Options */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {categories.slice(0, 5).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {cat === "ALL" ? "All Protocols" : cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Sort:</span>
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="collateralAtRiskUsd">Collateral At Risk (CaR)</option>
            <option value="healthScore">Health Score</option>
            <option value="tvlUsd">Total Value Locked</option>
          </select>
        </div>
      </div>

      {/* Protocols Health Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono-code uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Protocol & Chain</th>
                <th className="py-3 px-4">Risk Grade</th>
                <th className="py-3 px-4">TVL</th>
                <th className="py-3 px-4">Collateral At Risk</th>
                <th className="py-3 px-4">Liq Buffer</th>
                <th className="py-3 px-4">Entropy</th>
                <th className="py-3 px-4">Bridge Sync</th>
                <th className="py-3 px-4">Timelock</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredProtocols.map((p) => (
                <tr
                  key={p.id}
                  id={`protocol-row-${p.id}`}
                  className="hover:bg-slate-800/40 transition-colors font-mono-code"
                >
                  <td className="py-3.5 px-4">
                    <div className="font-sans font-semibold text-white text-sm flex items-center gap-2">
                      <span>{p.name}</span>
                      {p.auditFirms && p.auditFirms.length > 0 && (
                        <span className="text-[9px] px-1 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono-code hidden sm:inline">
                          ✓ {p.auditFirms[0]}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center flex-wrap gap-1.5 mt-0.5">
                      <span className="text-[11px] text-slate-400 font-sans">{p.category} · {p.chain}</span>
                      {p.contractAddress && (
                        <a
                          href={p.explorerUrl || `https://etherscan.io/address/${p.contractAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[10px] text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-0.5 font-mono-code"
                          title={`Verified On-Chain Contract: ${p.contractAddress}`}
                        >
                          <span>{p.contractAddress.slice(0, 6)}...{p.contractAddress.slice(-4)}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getGradeColor(p.riskGrade)}`}>
                      {p.riskGrade} ({p.healthScore})
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-slate-200 font-medium">
                    ${(p.tvlUsd / 1_000_000_000).toFixed(2)}B
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="text-amber-400 font-bold">
                      ${(p.collateralAtRiskUsd / 1_000_000).toFixed(1)}M
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {((p.collateralAtRiskUsd / p.tvlUsd) * 100).toFixed(1)}% of TVL
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-slate-300">
                    <span className={p.liquidationBufferPct < 20 ? "text-rose-400 font-bold" : "text-emerald-400"}>
                      {p.liquidationBufferPct}%
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-cyan-400 h-full rounded-full"
                          style={{ width: `${p.liquidityEntropy * 100}%` }}
                        ></div>
                      </div>
                      <span>{p.liquidityEntropy}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className={p.bridgeBalanceSync < 99 ? "text-amber-400" : "text-emerald-400"}>
                      {p.bridgeBalanceSync}%
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className={p.governanceTimelockHours < 24 ? "text-rose-400 font-bold" : "text-slate-300"}>
                      {p.governanceTimelockHours}h
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onSelectProtocol(p)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-sans font-medium transition-colors cursor-pointer"
                      >
                        Inspect
                      </button>
                      <button
                        onClick={() => onTriggerPause(p.name)}
                        className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-[11px] font-sans font-medium border border-rose-500/30 transition-colors cursor-pointer"
                      >
                        Pause
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
