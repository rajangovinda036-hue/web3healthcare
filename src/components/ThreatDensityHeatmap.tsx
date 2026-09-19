import React, { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import {
  Flame,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Activity,
  AlertTriangle,
  Info,
  Shield,
  Zap,
  Crosshair,
  Filter
} from "lucide-react";
import { ThreatEvent } from "../types";

export interface ThreatDensityHeatmapProps {
  threats: ThreatEvent[];
  selectedChain: string;
  onSelectThreat?: (threat: ThreatEvent) => void;
  onSelectProtocol?: (protocolName: string) => void;
  selectedProtocol?: string | null;
}

interface ProtocolHotspot {
  id: string;
  name: string;
  category: "Lending & Collateral" | "DEX & Stableswap" | "Derivatives & Perps" | "Cross-Chain Bridge" | "Liquid Staking";
  chain: string;
  threats: ThreatEvent[];
  threatCount: number;
  totalLossUsd: number;
  maxSeverity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  maxConfidence: number;
  avgLatency: number;
  maxTwapDeviation: number;
  reentrancyDepth: number;
  densityScore: number; // 0 - 100
  targetContract: string;
  x: number;
  y: number;
  baseRadius: number;
}

interface InteractionLink {
  source: string;
  target: string;
  type: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  volumeUsd: number;
}

// Preset baseline DeFi hotspots across chains to contextualize live threat surges
const BASELINE_HOTSPOTS: Array<Omit<ProtocolHotspot, "threats" | "threatCount" | "totalLossUsd" | "maxSeverity" | "maxConfidence" | "avgLatency" | "maxTwapDeviation" | "reentrancyDepth" | "densityScore" | "baseRadius">> = [
  {
    id: "apexlend",
    name: "ApexLend v2 Vault",
    category: "Lending & Collateral",
    chain: "Ethereum Mainnet",
    targetContract: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    x: 280,
    y: 190
  },
  {
    id: "curve-steth",
    name: "Curve 3pool & TriCrypto",
    category: "DEX & Stableswap",
    chain: "Ethereum Mainnet",
    targetContract: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
    x: 210,
    y: 290
  },
  {
    id: "gmx-gateway",
    name: "GMX-Derivative Gateway",
    category: "Derivatives & Perps",
    chain: "Arbitrum One",
    targetContract: "0x1111111254fb6c44bac0bed2854e76f90643097d",
    x: 620,
    y: 160
  },
  {
    id: "aerodrome-router",
    name: "Aerodrome Liquidity Router",
    category: "DEX & Stableswap",
    chain: "Base",
    targetContract: "0x4200000000000000000000000000000000000006",
    x: 480,
    y: 340
  },
  {
    id: "aave-v3-core",
    name: "Aave v3 Core",
    category: "Lending & Collateral",
    chain: "Ethereum Mainnet",
    targetContract: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
    x: 400,
    y: 140
  },
  {
    id: "uniswap-v3-wbtc",
    name: "Uniswap v3 Pools",
    category: "DEX & Stableswap",
    chain: "Ethereum Mainnet",
    targetContract: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
    x: 350,
    y: 260
  },
  {
    id: "stargate-v2",
    name: "Stargate v2 Router",
    category: "Cross-Chain Bridge",
    chain: "Multi-Chain",
    targetContract: "0xaf5191b0de27e2a77955b577e580c83ca2ac3487",
    x: 720,
    y: 280
  },
  {
    id: "morpho-blue",
    name: "Morpho Blue Vaults",
    category: "Lending & Collateral",
    chain: "Ethereum Mainnet",
    targetContract: "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb",
    x: 520,
    y: 220
  }
];

export const ThreatDensityHeatmap: React.FC<ThreatDensityHeatmapProps> = ({
  threats,
  selectedChain,
  onSelectThreat,
  onSelectProtocol,
  selectedProtocol
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [metricMode, setMetricMode] = useState<"density" | "capital" | "twap">("density");
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");
  const [showHaloEffect, setShowHaloEffect] = useState<boolean>(true);
  const [showVectorLinks, setShowVectorLinks] = useState<boolean>(true);
  const [hoveredHotspot, setHoveredHotspot] = useState<ProtocolHotspot | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Compute protocol hotspots by cross-referencing baseline hotspots and active mempool threats
  const hotspotsData = useMemo<ProtocolHotspot[]>(() => {
    // 1. Group active threats by protocol
    const threatMap = new Map<string, ThreatEvent[]>();
    threats.forEach((t) => {
      const key = t.protocol.toLowerCase();
      if (!threatMap.has(key)) {
        threatMap.set(key, []);
      }
      threatMap.get(key)!.push(t);
    });

    const results: ProtocolHotspot[] = [];

    // Map known baseline hotspots
    BASELINE_HOTSPOTS.forEach((base) => {
      // Find matching threats
      let matchedThreats: ThreatEvent[] = [];
      threatMap.forEach((tList, key) => {
        if (
          key.includes(base.name.toLowerCase()) ||
          base.name.toLowerCase().includes(key) ||
          key.split(" ")[0] === base.name.toLowerCase().split(" ")[0]
        ) {
          matchedThreats = [...matchedThreats, ...tList];
        }
      });

      // Filter by severity if active
      const activeThreatsFiltered = filterSeverity === "ALL"
        ? matchedThreats
        : matchedThreats.filter((t) => t.severity === filterSeverity);

      const threatCount = activeThreatsFiltered.length;
      const totalLossUsd = activeThreatsFiltered.reduce((sum, t) => sum + t.potentialLossUsd, 0);
      const maxSeverity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" = activeThreatsFiltered.some((t) => t.severity === "CRITICAL")
        ? "CRITICAL"
        : activeThreatsFiltered.some((t) => t.severity === "HIGH")
        ? "HIGH"
        : activeThreatsFiltered.some((t) => t.severity === "MEDIUM")
        ? "MEDIUM"
        : "LOW";

      const maxConfidence = activeThreatsFiltered.reduce((max, t) => Math.max(max, t.confidenceScore), 0);
      const avgLatency = threatCount > 0
        ? Math.round(activeThreatsFiltered.reduce((sum, t) => sum + t.detectionLatencyMs, 0) / threatCount)
        : 0;
      const maxTwapDeviation = activeThreatsFiltered.reduce(
        (max, t) => Math.max(max, t.stateDiffSummary?.oraclePriceDeviationPct || 0),
        0
      );
      const reentrancyDepth = activeThreatsFiltered.reduce(
        (max, t) => Math.max(max, t.stateDiffSummary?.reentrancyDepth || 0),
        0
      );

      // Density calculation: combination of loss volume, severity multiplier, and confidence
      let severityMultiplier = 1.0;
      if (maxSeverity === "CRITICAL") severityMultiplier = 2.4;
      else if (maxSeverity === "HIGH") severityMultiplier = 1.6;
      else if (maxSeverity === "MEDIUM") severityMultiplier = 1.2;

      const volumeScore = Math.min(60, (totalLossUsd / 1_000_000) * 4);
      const threatScore = Math.min(30, threatCount * 12);
      const twapScore = Math.min(10, maxTwapDeviation * 0.8);
      const calculatedDensity = threatCount > 0
        ? Math.min(100, Math.round((volumeScore + threatScore + twapScore) * (severityMultiplier / 2)))
        : 8; // baseline quiescent traffic

      results.push({
        ...base,
        threats: activeThreatsFiltered,
        threatCount,
        totalLossUsd,
        maxSeverity: threatCount > 0 ? maxSeverity : "LOW",
        maxConfidence: threatCount > 0 ? maxConfidence : 88.0,
        avgLatency: threatCount > 0 ? avgLatency : 42,
        maxTwapDeviation,
        reentrancyDepth,
        densityScore: calculatedDensity,
        baseRadius: Math.max(18, Math.min(42, 18 + (calculatedDensity / 100) * 24))
      });
    });

    // Check if any threat wasn't in baseline hotspots, add dynamic coordinate
    threats.forEach((t, idx) => {
      const alreadyIncluded = results.some(
        (h) => h.name.toLowerCase().includes(t.protocol.toLowerCase()) || t.protocol.toLowerCase().includes(h.name.toLowerCase())
      );
      if (!alreadyIncluded) {
        const dynamicX = 180 + (idx * 160) % 650;
        const dynamicY = 160 + (idx * 90) % 280;
        const density = t.severity === "CRITICAL" ? 88 : t.severity === "HIGH" ? 68 : 45;

        results.push({
          id: `dyn-${t.id}`,
          name: t.protocol,
          category: "Lending & Collateral",
          chain: t.chain,
          targetContract: t.targetContract,
          x: dynamicX,
          y: dynamicY,
          threats: [t],
          threatCount: 1,
          totalLossUsd: t.potentialLossUsd,
          maxSeverity: t.severity,
          maxConfidence: t.confidenceScore,
          avgLatency: t.detectionLatencyMs,
          maxTwapDeviation: t.stateDiffSummary?.oraclePriceDeviationPct || 0,
          reentrancyDepth: t.stateDiffSummary?.reentrancyDepth || 0,
          densityScore: density,
          baseRadius: 28
        });
      }
    });

    return results;
  }, [threats, filterSeverity]);

  // Inter-protocol mempool vector interaction links
  const interactionLinks = useMemo<InteractionLink[]>(() => {
    return [
      {
        source: "curve-steth",
        target: "apexlend",
        type: "Flashloan Oracle Deviation Injection",
        severity: "CRITICAL",
        volumeUsd: 14200000
      },
      {
        source: "uniswap-v3-wbtc",
        target: "apexlend",
        type: "Pool Reserve Arbitrage Pull",
        severity: "HIGH",
        volumeUsd: 42500000
      },
      {
        source: "uniswap-v3-wbtc",
        target: "morpho-blue",
        type: "Mempool Collateral Rebalance",
        severity: "MEDIUM",
        volumeUsd: 6500000
      },
      {
        source: "aerodrome-router",
        target: "aave-v3-core",
        type: "Cross-DEX Flash Swap Route",
        severity: "HIGH",
        volumeUsd: 4100000
      },
      {
        source: "gmx-gateway",
        target: "stargate-v2",
        type: "Bridge Asset Withdrawal Request",
        severity: "CRITICAL",
        volumeUsd: 8900000
      },
      {
        source: "morpho-blue",
        target: "aave-v3-core",
        type: "Liquidity Relay Call",
        severity: "MEDIUM",
        volumeUsd: 2800000
      }
    ];
  }, []);

  // Filter hotspots by chain if requested
  const filteredHotspots = useMemo(() => {
    if (selectedChain === "All Chains") return hotspotsData;
    const chainSub = selectedChain.toLowerCase().replace(" one", "");
    return hotspotsData.filter(
      (h) => h.chain.toLowerCase().includes(chainSub) || h.chain === "Multi-Chain"
    );
  }, [hotspotsData, selectedChain]);

  // Total metrics
  const totalHeatAverted = useMemo(() => {
    return filteredHotspots.reduce((sum, h) => sum + h.totalLossUsd, 0);
  }, [filteredHotspots]);

  const maxDensityNode = useMemo(() => {
    if (!filteredHotspots.length) return null;
    return [...filteredHotspots].sort((a, b) => b.densityScore - a.densityScore)[0];
  }, [filteredHotspots]);

  // Render D3 SVG visualization
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = 860;
    const height = 480;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .classed("w-full h-auto select-none", true);

    // 1. Setup SVG Defs (Gradients, Gaussian Blurs, Glow Filters)
    const defs = svg.append("defs");

    // Gaussian blur filter for heat halos
    const blurFilter = defs
      .append("filter")
      .attr("id", "heat-blur")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");
    blurFilter
      .append("feGaussianBlur")
      .attr("stdDeviation", "18")
      .attr("result", "blur");

    // Sharp drop-shadow filter for nodes
    const dropShadow = defs
      .append("filter")
      .attr("id", "node-shadow")
      .attr("x", "-30%")
      .attr("y", "-30%")
      .attr("width", "160%")
      .attr("height", "160%");
    dropShadow.append("feDropShadow").attr("dx", "0").attr("dy", "3").attr("stdDeviation", "4").attr("flood-color", "#020617").attr("flood-opacity", "0.9");

    // Critical Heat Gradient (Rose - Red - Magenta)
    const critGrad = defs.append("radialGradient").attr("id", "heat-critical");
    critGrad.append("stop").attr("offset", "0%").attr("stop-color", "#f43f5e").attr("stop-opacity", 0.85);
    critGrad.append("stop").attr("offset", "40%").attr("stop-color", "#e11d48").attr("stop-opacity", 0.55);
    critGrad.append("stop").attr("offset", "75%").attr("stop-color", "#881337").attr("stop-opacity", 0.25);
    critGrad.append("stop").attr("offset", "100%").attr("stop-color", "#0f172a").attr("stop-opacity", 0);

    // High Heat Gradient (Amber - Orange)
    const highGrad = defs.append("radialGradient").attr("id", "heat-high");
    highGrad.append("stop").attr("offset", "0%").attr("stop-color", "#fbbf24").attr("stop-opacity", 0.8);
    highGrad.append("stop").attr("offset", "45%").attr("stop-color", "#d97706").attr("stop-opacity", 0.5);
    highGrad.append("stop").attr("offset", "80%").attr("stop-color", "#78350f").attr("stop-opacity", 0.2);
    highGrad.append("stop").attr("offset", "100%").attr("stop-color", "#0f172a").attr("stop-opacity", 0);

    // Elevated Heat Gradient (Cyan - Teal)
    const medGrad = defs.append("radialGradient").attr("id", "heat-medium");
    medGrad.append("stop").attr("offset", "0%").attr("stop-color", "#22d3ee").attr("stop-opacity", 0.7);
    medGrad.append("stop").attr("offset", "50%").attr("stop-color", "#0891b2").attr("stop-opacity", 0.4);
    medGrad.append("stop").attr("offset", "85%").attr("stop-color", "#164e63").attr("stop-opacity", 0.15);
    medGrad.append("stop").attr("offset", "100%").attr("stop-color", "#0f172a").attr("stop-opacity", 0);

    // Low / Quiescent Gradient
    const lowGrad = defs.append("radialGradient").attr("id", "heat-low");
    lowGrad.append("stop").attr("offset", "0%").attr("stop-color", "#38bdf8").attr("stop-opacity", 0.35);
    lowGrad.append("stop").attr("offset", "60%").attr("stop-color", "#0284c7").attr("stop-opacity", 0.15);
    lowGrad.append("stop").attr("offset", "100%").attr("stop-color", "#0f172a").attr("stop-opacity", 0);

    // Main Zoomable Canvas Group
    const g = svg.append("g").attr("class", "viewport-group");

    // D3 Zoom Behavior
    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.7, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoomBehavior);

    // 2. Background Grid Pattern & Coordinate Crosshairs
    const gridGroup = g.append("g").attr("class", "grid-layer").attr("opacity", 0.35);

    // Subtle radar concentric rings
    [90, 180, 270, 360, 440].forEach((r) => {
      gridGroup
        .append("circle")
        .attr("cx", width / 2)
        .attr("cy", height / 2)
        .attr("r", r)
        .attr("fill", "none")
        .attr("stroke", "#1e293b")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "3 5");
    });

    // Sub-grid crosshairs & ticks
    for (let x = 60; x < width; x += 80) {
      gridGroup
        .append("line")
        .attr("x1", x)
        .attr("y1", 0)
        .attr("x2", x)
        .attr("y2", height)
        .attr("stroke", "#0f172a")
        .attr("stroke-width", 0.8);
    }
    for (let y = 40; y < height; y += 60) {
      gridGroup
        .append("line")
        .attr("x1", 0)
        .attr("y1", y)
        .attr("x2", width)
        .attr("y2", y)
        .attr("stroke", "#0f172a")
        .attr("stroke-width", 0.8);
    }

    // 3. Render Inter-Protocol Interaction Vectors (D3 curves)
    if (showVectorLinks) {
      const linksGroup = g.append("g").attr("class", "links-layer");

      interactionLinks.forEach((link) => {
        const sourceNode = filteredHotspots.find((h) => h.id === link.source);
        const targetNode = filteredHotspots.find((h) => h.id === link.target);

        if (!sourceNode || !targetNode) return;

        // Quadratic bezier curved path
        const dx = targetNode.x - sourceNode.x;
        const dy = targetNode.y - sourceNode.y;
        const dr = Math.sqrt(dx * dx + dy * dy);
        const midX = (sourceNode.x + targetNode.x) / 2 - dy * 0.15;
        const midY = (sourceNode.y + targetNode.y) / 2 + dx * 0.15;

        const pathData = `M ${sourceNode.x} ${sourceNode.y} Q ${midX} ${midY} ${targetNode.x} ${targetNode.y}`;

        const isCritical = link.severity === "CRITICAL";
        const isHigh = link.severity === "HIGH";
        const strokeColor = isCritical ? "#f43f5e" : isHigh ? "#f59e0b" : "#06b6d4";

        // Background glow path
        linksGroup
          .append("path")
          .attr("d", pathData)
          .attr("fill", "none")
          .attr("stroke", strokeColor)
          .attr("stroke-width", isCritical ? 3.5 : 2)
          .attr("stroke-opacity", isCritical ? 0.4 : 0.25)
          .attr("filter", "url(#heat-blur)");

        // Foreground animated vector stroke
        const linkPath = linksGroup
          .append("path")
          .attr("d", pathData)
          .attr("fill", "none")
          .attr("stroke", strokeColor)
          .attr("stroke-width", isCritical ? 1.8 : 1.2)
          .attr("stroke-opacity", 0.8)
          .attr("stroke-dasharray", isCritical ? "6 4" : "4 4");

        // Subtle animation pulse
        linkPath
          .append("animate")
          .attr("attributeName", "stroke-dashoffset")
          .attr("values", "100; 0")
          .attr("dur", isCritical ? "1.8s" : "3s")
          .attr("repeatCount", "indefinite");
      });
    }

    // 4. Render D3 Radial Heat Halos (Threat Density Hotspots)
    if (showHaloEffect) {
      const heatGroup = g.append("g").attr("class", "heat-halo-layer");

      filteredHotspots.forEach((node) => {
        const haloRadius = node.baseRadius * (node.threatCount > 0 ? 3.6 : 2.2);

        let gradId = "heat-low";
        if (node.maxSeverity === "CRITICAL") gradId = "heat-critical";
        else if (node.maxSeverity === "HIGH") gradId = "heat-high";
        else if (node.maxSeverity === "MEDIUM") gradId = "heat-medium";

        // Outer ambient blur
        heatGroup
          .append("circle")
          .attr("cx", node.x)
          .attr("cy", node.y)
          .attr("r", haloRadius)
          .attr("fill", `url(#${gradId})`)
          .attr("filter", "url(#heat-blur)")
          .attr("opacity", node.threatCount > 0 ? 0.95 : 0.4);

        // Secondary density contour ring for high threats
        if (node.densityScore > 50) {
          heatGroup
            .append("circle")
            .attr("cx", node.x)
            .attr("cy", node.y)
            .attr("r", haloRadius * 0.65)
            .attr("fill", "none")
            .attr("stroke", node.maxSeverity === "CRITICAL" ? "#f43f5e" : "#f59e0b")
            .attr("stroke-width", 0.9)
            .attr("stroke-opacity", 0.5)
            .attr("stroke-dasharray", "4 4");
        }
      });
    }

    // 5. Render Core Protocol Nodes & Interaction Hotspot Rings
    const nodesGroup = g.append("g").attr("class", "nodes-layer");

    filteredHotspots.forEach((node) => {
      const isSelected = selectedProtocol && node.name.toLowerCase().includes(selectedProtocol.toLowerCase());
      const hasCriticalThreat = node.maxSeverity === "CRITICAL" && node.threatCount > 0;
      const hasHighThreat = node.maxSeverity === "HIGH" && node.threatCount > 0;

      const nodeG = nodesGroup
        .append("g")
        .attr("class", "hotspot-node")
        .attr("transform", `translate(${node.x}, ${node.y})`)
        .style("cursor", "pointer");

      // Pulsing threat warning ring for active hotspots
      if (node.threatCount > 0) {
        const pulseCircle = nodeG
          .append("circle")
          .attr("r", node.baseRadius + 6)
          .attr("fill", "none")
          .attr("stroke", hasCriticalThreat ? "#f43f5e" : hasHighThreat ? "#f59e0b" : "#06b6d4")
          .attr("stroke-width", 1.5)
          .attr("opacity", 0.8);

        pulseCircle
          .append("animate")
          .attr("attributeName", "r")
          .attr("values", `${node.baseRadius + 4}; ${node.baseRadius + 18}; ${node.baseRadius + 4}`)
          .attr("dur", hasCriticalThreat ? "1.4s" : "2.4s")
          .attr("repeatCount", "indefinite");

        pulseCircle
          .append("animate")
          .attr("attributeName", "opacity")
          .attr("values", "0.8; 0.05; 0.8")
          .attr("dur", hasCriticalThreat ? "1.4s" : "2.4s")
          .attr("repeatCount", "indefinite");
      }

      // Base background circle
      nodeG
        .append("circle")
        .attr("r", node.baseRadius)
        .attr("fill", "#090d16")
        .attr("stroke", isSelected ? "#38bdf8" : hasCriticalThreat ? "#f43f5e" : hasHighThreat ? "#f59e0b" : "#1e293b")
        .attr("stroke-width", isSelected ? 3 : hasCriticalThreat ? 2.5 : 1.5)
        .attr("filter", "url(#node-shadow)");

      // Inner heat intensity ring based on selected metric
      const innerRadius = Math.max(6, node.baseRadius - 5);
      const metricFill =
        metricMode === "twap" && node.maxTwapDeviation > 5
          ? "#f59e0b"
          : metricMode === "capital" && node.totalLossUsd > 10_000_000
          ? "#f43f5e"
          : node.densityScore > 70
          ? "#e11d48"
          : node.densityScore > 40
          ? "#d97706"
          : "#0284c7";

      nodeG
        .append("circle")
        .attr("r", innerRadius)
        .attr("fill", metricFill)
        .attr("fill-opacity", node.threatCount > 0 ? 0.35 : 0.15)
        .attr("stroke", metricFill)
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", node.threatCount > 0 ? "none" : "2 2");

      // Acronym label in center of circle
      const acronym = node.name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase();

      nodeG
        .append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("fill", "#ffffff")
        .attr("font-size", `${Math.max(10, node.baseRadius * 0.48)}px`)
        .attr("font-weight", "700")
        .attr("font-family", "ui-monospace, SFMono-Regular, Menlo, monospace")
        .text(acronym);

      // Label below the hotspot node
      const labelG = nodeG.append("g").attr("transform", `translate(0, ${node.baseRadius + 14})`);

      labelG
        .append("text")
        .attr("text-anchor", "middle")
        .attr("fill", isSelected ? "#38bdf8" : "#f1f5f9")
        .attr("font-size", "11px")
        .attr("font-weight", "600")
        .attr("letter-spacing", "0.02em")
        .text(node.name);

      // Secondary metric pill under label
      const subMetricText =
        metricMode === "capital"
          ? `$${(node.totalLossUsd / 1_000_000).toFixed(1)}M loss`
          : metricMode === "twap"
          ? `${node.maxTwapDeviation.toFixed(1)}% TWAP`
          : `Density: ${node.densityScore}/100`;

      labelG
        .append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "13px")
        .attr("fill", hasCriticalThreat ? "#fb7185" : hasHighThreat ? "#fbbf24" : "#94a3b8")
        .attr("font-size", "9.5px")
        .attr("font-family", "ui-monospace, monospace")
        .text(subMetricText);

      // Threat Badge on top-right of node if active alerts
      if (node.threatCount > 0) {
        const badgeG = nodeG.append("g").attr("transform", `translate(${node.baseRadius * 0.7}, ${-node.baseRadius * 0.7})`);

        badgeG
          .append("circle")
          .attr("r", 9)
          .attr("fill", hasCriticalThreat ? "#f43f5e" : "#f59e0b")
          .attr("stroke", "#020617")
          .attr("stroke-width", 2);

        badgeG
          .append("text")
          .attr("text-anchor", "middle")
          .attr("dy", "0.35em")
          .attr("fill", "#ffffff")
          .attr("font-size", "9px")
          .attr("font-weight", "800")
          .attr("font-family", "monospace")
          .text(node.threatCount);
      }

      // Node Event Handlers: Hover and Click
      nodeG
        .on("mouseenter", function (event) {
          d3.select(this).select("circle").attr("stroke-width", 3.5).attr("stroke", "#38bdf8");
          setHoveredHotspot(node);

          if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setTooltipPos({
              x: event.clientX - rect.left,
              y: event.clientY - rect.top
            });
          }
        })
        .on("mousemove", function (event) {
          if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setTooltipPos({
              x: event.clientX - rect.left,
              y: event.clientY - rect.top
            });
          }
        })
        .on("mouseleave", function () {
          d3.select(this)
            .select("circle")
            .attr("stroke-width", isSelected ? 3 : hasCriticalThreat ? 2.5 : 1.5)
            .attr("stroke", isSelected ? "#38bdf8" : hasCriticalThreat ? "#f43f5e" : hasHighThreat ? "#f59e0b" : "#1e293b");
          setHoveredHotspot(null);
          setTooltipPos(null);
        })
        .on("click", function () {
          if (onSelectProtocol) {
            onSelectProtocol(node.name);
          }
          if (node.threats.length > 0 && onSelectThreat) {
            onSelectThreat(node.threats[0]);
          }
        });
    });
  }, [
    filteredHotspots,
    interactionLinks,
    showHaloEffect,
    showVectorLinks,
    metricMode,
    selectedProtocol,
    onSelectProtocol,
    onSelectThreat
  ]);

  const handleResetZoom = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(500).call(d3.zoom<SVGSVGElement, unknown>().transform, d3.zoomIdentity);
  };

  const handleZoomIn = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(300).call(d3.zoom<SVGSVGElement, unknown>().scaleBy, 1.3);
  };

  const handleZoomOut = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(300).call(d3.zoom<SVGSVGElement, unknown>().scaleBy, 0.7);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl" id="threat-density-heatmap-card">
      {/* Header Bar */}
      <div className="p-4 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-950/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                Threat Density Heatmap
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-mono-code font-bold">
                D3.JS VECTOR TOPOLOGY
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Topological SVG map of mempool transaction interaction hotspots, flash loan liquidity routing, and TWAP oracle deviations.
            </p>
          </div>
        </div>

        {/* Action Controls & Metric Switchers */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Metric Selector */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setMetricMode("density")}
              id="btn-metric-density"
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                metricMode === "density"
                  ? "bg-cyan-500/20 text-cyan-300 font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Threat Density
            </button>
            <button
              onClick={() => setMetricMode("capital")}
              id="btn-metric-capital"
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                metricMode === "capital"
                  ? "bg-rose-500/20 text-rose-300 font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Capital at Risk
            </button>
            <button
              onClick={() => setMetricMode("twap")}
              id="btn-metric-twap"
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                metricMode === "twap"
                  ? "bg-amber-500/20 text-amber-300 font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              TWAP Skew %
            </button>
          </div>

          {/* Halo toggle */}
          <button
            onClick={() => setShowHaloEffect(!showHaloEffect)}
            id="btn-toggle-halo"
            className={`p-1.5 rounded-lg border text-xs font-mono-code flex items-center gap-1 transition-colors cursor-pointer ${
              showHaloEffect
                ? "bg-slate-800 border-slate-700 text-cyan-400"
                : "bg-slate-950 border-slate-800 text-slate-500"
            }`}
            title="Toggle Gaussian heat halos"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Halos</span>
          </button>

          {/* Vector link toggle */}
          <button
            onClick={() => setShowVectorLinks(!showVectorLinks)}
            id="btn-toggle-vectors"
            className={`p-1.5 rounded-lg border text-xs font-mono-code flex items-center gap-1 transition-colors cursor-pointer ${
              showVectorLinks
                ? "bg-slate-800 border-slate-700 text-cyan-400"
                : "bg-slate-950 border-slate-800 text-slate-500"
            }`}
            title="Toggle interaction route vectors"
          >
            <Activity className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Vectors</span>
          </button>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1">
            <button
              onClick={handleZoomIn}
              id="btn-heatmap-zoom-in"
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleZoomOut}
              id="btn-heatmap-zoom-out"
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              id="btn-heatmap-reset-zoom"
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 cursor-pointer"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Top-Bar Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-950/40 border-b border-slate-800 text-xs font-mono-code">
        <div className="px-2.5 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <span className="text-slate-400">Total Hotspots:</span>
          <span className="text-white font-bold">{filteredHotspots.length} protocols</span>
        </div>

        <div className="px-2.5 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <span className="text-slate-400">Hotspot Exposure:</span>
          <span className="text-rose-400 font-bold">
            ${(totalHeatAverted / 1_000_000).toFixed(1)}M
          </span>
        </div>

        <div className="px-2.5 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <span className="text-slate-400">Max Intensity Node:</span>
          <span className="text-amber-300 font-bold truncate max-w-[110px]" title={maxDensityNode?.name}>
            {maxDensityNode?.name || "None"}
          </span>
        </div>

        <div className="px-2.5 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <span className="text-slate-400">SLA Sampling:</span>
          <span className="text-cyan-400 font-bold">&lt; 400ms Realtime</span>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div ref={containerRef} className="relative w-full bg-slate-950 h-[460px] overflow-hidden">
        <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" id="threat-density-svg" />

        {/* Floating Tooltip Card */}
        {hoveredHotspot && tooltipPos && (
          <div
            className="absolute z-20 pointer-events-none p-3.5 rounded-xl bg-slate-900/95 border border-cyan-500/40 shadow-2xl text-xs w-72 backdrop-blur-md"
            style={{
              left: Math.min(Math.max(10, tooltipPos.x + 15), (containerRef.current?.clientWidth || 800) - 300),
              top: Math.min(Math.max(10, tooltipPos.y - 40), (containerRef.current?.clientHeight || 450) - 220)
            }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-white text-sm truncate">{hoveredHotspot.name}</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono-code ${
                  hoveredHotspot.maxSeverity === "CRITICAL"
                    ? "bg-rose-950 text-rose-400 border border-rose-800"
                    : hoveredHotspot.maxSeverity === "HIGH"
                    ? "bg-amber-950 text-amber-400 border border-amber-800"
                    : "bg-cyan-950 text-cyan-400 border border-cyan-800"
                }`}
              >
                {hoveredHotspot.maxSeverity}
              </span>
            </div>

            <div className="text-[11px] text-slate-400 mb-2 font-mono-code">
              <span>{hoveredHotspot.category}</span> · <span>{hoveredHotspot.chain}</span>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-800/80 font-mono-code text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Threat Density Index:</span>
                <span className="font-bold text-rose-400">{hoveredHotspot.densityScore} / 100</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Active Threat Count:</span>
                <span className="font-bold text-white">{hoveredHotspot.threatCount} attacks</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Capital At Risk:</span>
                <span className="font-bold text-rose-300">
                  ${(hoveredHotspot.totalLossUsd / 1_000_000).toFixed(2)}M
                </span>
              </div>
              {hoveredHotspot.maxTwapDeviation > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">TWAP Oracle Skew:</span>
                  <span className="font-bold text-amber-400">{hoveredHotspot.maxTwapDeviation}%</span>
                </div>
              )}
              {hoveredHotspot.reentrancyDepth > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Reentrancy Call Depth:</span>
                  <span className="font-bold text-cyan-400">{hoveredHotspot.reentrancyDepth}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                <span>Contract:</span>
                <span className="truncate max-w-[140px] text-slate-400">{hoveredHotspot.targetContract}</span>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-800 text-[10px] text-cyan-400 flex items-center justify-between">
              <span>Click node to filter mempool feed</span>
              <Crosshair className="w-3.5 h-3.5" />
            </div>
          </div>
        )}

        {/* Legend Overlay at Bottom */}
        <div className="absolute bottom-3 left-3 right-3 p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80 backdrop-blur-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-slate-400 font-medium text-[11px]">Heatmap Density Spectrum:</span>
            <div className="flex items-center gap-1.5 font-mono-code text-[10px]">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block shadow-sm shadow-cyan-500/50"></span>
              <span className="text-slate-300">Low Flow</span>
              <span className="text-slate-600">→</span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block shadow-sm shadow-amber-500/50"></span>
              <span className="text-slate-300">Elevated</span>
              <span className="text-slate-600">→</span>
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shadow-sm shadow-rose-500/50"></span>
              <span className="text-slate-300">Critical Threat Hotspot</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono-code">
            <span className="flex items-center gap-1">
              <span className="w-2 h-0.5 bg-rose-500 inline-block"></span>
              <span>Dashed lines: Flash loan/arbitrage routing vectors</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
