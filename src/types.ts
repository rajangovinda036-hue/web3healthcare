export interface StateDiffSummary {
  poolReservesBefore: string;
  poolReservesAfter: string;
  oraclePriceDeviationPct: number;
  reentrancyDepth: number;
  bytecodeSignature: string;
}

export interface ThreatEvent {
  id: string;
  txHash: string;
  chain: string;
  protocol: string;
  threatType: "Flash Loan Arbitrage & Oracle Skew" | "Reentrancy Liquidity Drain" | "Unauthorized Timelock Bypass / Admin Upgrade" | "Bridge Balance Desync" | "Sandwich Attack & Liquidity Extraction";
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status: "DETECTED_PRE_EXECUTION" | "CIRCUIT_BREAKER_TRIGGERED" | "MITIGATED" | "MONITORING";
  detectionLatencyMs: number;
  borrowedCapitalUsd: number;
  potentialLossUsd: number;
  fromAddress: string;
  targetContract: string;
  timestamp: string;
  confidenceScore: number;
  stateDiffSummary: StateDiffSummary;
  details: string;
  explorerTxUrl?: string;
  explorerContractUrl?: string;
}

export interface ProtocolHealth {
  id: string;
  name: string;
  category: string;
  chain: string;
  tvlUsd: number;
  collateralAtRiskUsd: number;
  healthScore: number; // 0 - 100
  liquidationBufferPct: number;
  liquidityEntropy: number; // 0 - 1
  bridgeBalanceSync: number; // %
  governanceTimelockHours: number;
  status: "HEALTHY" | "ELEVATED_RISK" | "HIGH_MONITORING" | "CRITICAL_DEFICIT";
  riskGrade: "A+" | "A" | "B+" | "B" | "B-" | "C+" | "C" | "D";
  activeAlertsCount: number;
  contagionExposureUsd: number;
  contractAddress?: string;
  auditFirms?: string[];
  explorerUrl?: string;
  guardianMultisig?: string;
}

export interface ContagionNode {
  id: string;
  type: string;
  risk: number;
  tvl: string;
  collateralAtRisk: string;
  x: number;
  y: number;
}

export interface ContagionEdge {
  from: string;
  to: string;
  label: string;
  weight: number;
  riskTransmissibility: "Low" | "Medium" | "High" | "Critical";
}

export interface ContagionGraphData {
  nodes: ContagionNode[];
  edges: ContagionEdge[];
}

export interface CircuitBreakerLog {
  id: string;
  protocol: string;
  action: string;
  triggerLatencyMs: number;
  triggeredBy: string;
  timestamp: string;
  attestationSignature: string;
  status: string;
}

export interface AIAnalysisResult {
  rootCause: string;
  exploitVectorBreakdown: string[];
  mitigationRecommendation: string;
  solidityCountermeasure: string;
  modelUsed?: string;
}

export interface MonitoredUser {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "GUARDIAN_OPERATOR" | "PROTOCOL_AUDITOR" | "RISK_ANALYST" | "EXTERNAL_AGENT" | "STANDARD_USER";
  walletAddress: string;
  status: "ONLINE" | "IDLE" | "OFFLINE";
  lastActive: string;
  currentView?: string;
  actionsCount24h: number;
  ipLocation: string;
  avatar: string;
  latencyMs: number;
  riskScore: "LOW" | "NORMAL" | "ELEVATED" | "FLAGGED";
}

export interface CurrentUserSession {
  email: string;
  name: string;
  role: string;
  isAdmin: boolean;
  walletAddress?: string;
  avatar: string;
  loginTime?: string;
}

export interface UserActivity {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: "SUPER_ADMIN" | "GUARDIAN_OPERATOR" | "PROTOCOL_AUDITOR" | "RISK_ANALYST" | "EXTERNAL_AGENT" | "STANDARD_USER";
  action: string;
  actionCategory: "SECURITY_OVERRIDE" | "EXPLOIT_SIMULATION" | "AI_AUDIT" | "MONITORING" | "CONFIGURATION" | "AUTHENTICATION";
  targetResource: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  status: "SUCCESS" | "WARNING" | "BLOCKED" | "FLAGGED";
  timestamp: string;
  latencyMs?: number;
  isAnomaly?: boolean;
}

export interface AdminUserSummary {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "GUARDIAN_OPERATOR" | "PROTOCOL_AUDITOR" | "RISK_ANALYST" | "EXTERNAL_AGENT" | "STANDARD_USER";
  walletAddress: string;
  status: "ONLINE" | "IDLE" | "OFFLINE";
  lastActive: string;
  actionsCount24h: number;
  ipLocation: string;
  avatar: string;
}

export interface SystemConfig {
  serverName: string;
  version: string;
  autoPauseEnabled: boolean;
  latencyThresholdMs: number;
  lossThresholdUsd: number;
  guardianQuorum: string;
  emergencyGlobalPause: boolean;
  mempoolSampleRateTps: number;
  relayerRpc: string;
  zeroCustodyEnforced: boolean;
  geminiModel: string;
}

export interface LiveChainStatus {
  chainId: number;
  chainName: string;
  blockNumber: number;
  gasPriceGwei: number;
  blockHash: string;
  timestamp: string;
  txCount: number;
  latencyMs: number;
  rpcUrl: string;
  explorerUrl: string;
  status: "ONLINE" | "SYNCING" | "ERROR";
}

export interface NetworkStatusResponse {
  chains: Record<string, LiveChainStatus>;
  serverTime: string;
  p99LatencyMs: number;
  mempoolTxScannedPerSec: number;
  latestBlocks: Array<{
    chain: string;
    blockNumber: number;
    hash: string;
    txCount: number;
    gasUsed: number;
    timestamp: string;
    sampleTxs: string[];
  }>;
}

export interface ServerStats {
  uptimeSeconds: number;
  nodeVersion: string;
  memoryUsageMb: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
  };
  mempoolTxCount: number;
  trackedProtocolsCount: number;
  activeThreatsCount: number;
  registeredUsersCount: number;
  circuitBreakersCount: number;
  geminiStatus: string;
}

