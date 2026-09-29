/**
 * Wholesale Commercial Analysis Engine Types
 */

export interface CommercialCalculationInput {
  // Volume Inputs
  outgoingMinutes: number;
  incomingMinutes: number;

  // Share Ratios (0.0 to 1.0 or 0% to 100%)
  outgoingShare: number;
  incomingShare: number;

  // Rates & Commercial Pricing
  incomingRevenueRate: number;  // Rate or Share for incoming traffic revenue
  outgoingCostRate: number;     // Rate for outgoing traffic wholesale cost
  outgoingRevenueRate: number; // Customer/Subscriber revenue per minute

  // Optional Granular Unit Cost Rates (per minute)
  interconnectCostRate?: number;
  terminationCostRate?: number;
  transitCostRate?: number;

  // Optional Lump-Sum Fixed / Operational Costs
  cableCapacityCost?: number;
  settlementCost?: number;
  regulatoryTaxCost?: number;
  otherOperatingCost?: number;

  // Currency & Multi-Currency conversion factor
  currency?: string;
  fxRateToReport?: number;
}

export interface CommercialCalculationOutput {
  // Derived Traffic Volumes
  calculatedOutgoingTraffic: number;
  calculatedIncomingTraffic: number;

  // Derived Revenues
  incomingRevenue: number;
  subscriberRevenue: number;
  totalRevenue: number;

  // Derived Costs
  wholesaleCost: number;
  totalVariableCost: number;
  totalFixedCost: number;
  totalCost: number;

  // Profitability Metrics
  grossProfit: number;
  netProfit: number;
  profitMarginPct: number;

  // Unit Metrics
  avgRevenuePerOutgoingMin: number;
  avgCostPerOutgoingMin: number;
  breakEvenSubscriberRate: number;
}

export interface CommercialCalculationConfig {
  /**
   * Defines whether optional granular rates (interconnect, transit, termination)
   * are included in variable cost calculations. Default: true
   */
  includeGranularVariableCosts?: boolean;

  /**
   * Defines whether lump-sum operational costs are included in Total Cost.
   * Default: true
   */
  includeFixedCostsInNetProfit?: boolean;
}

// -----------------------------------------------------------------
// Multi-Carrier Simulation Types (Phase 1 Workspace)
// -----------------------------------------------------------------

export interface CarrierSimulationInput {
  id?: string;
  carrierName: string;
  outgoingShare: number;      // e.g. 60 (for 60%) or 0.60
  incomingShare: number;      // e.g. 50 (for 50%) or 0.50
  incomingRevenueRate: number; // Rate per minute (e.g. 0.50)
  outgoingCostRate: number;    // Rate per minute (e.g. 0.70)
}

export interface CarrierSimulationOutput {
  id?: string;
  carrierName: string;
  outgoingSharePct: number;
  incomingSharePct: number;
  incomingRevenueRate: number;
  outgoingCostRate: number;
  calculatedOutgoingTraffic: number;
  calculatedIncomingTraffic: number;
  incomingRevenue: number;
  subscriberRevenue: number;
  totalRevenue: number;
  wholesaleCost: number;
  netProfit: number;
  profitMarginPct: number;
}

export interface MultiCarrierSimulationInput {
  id?: string;
  name?: string;
  description?: string;
  outgoingMinutes: number;      // Baseline Total Outgoing Minutes (e.g. 100000)
  incomingMinutes: number;      // Baseline Total Incoming Minutes (e.g. 200000)
  outgoingRevenueRate: number;  // Outgoing Subscriber Revenue Rate Per Min (e.g. 1.00)
  carriers: CarrierSimulationInput[];
}

export interface SimulationValidationResult {
  isValid: boolean;
  totalOutgoingSharePct: number;
  totalIncomingSharePct: number;
  isOutgoingShare100: boolean;
  isIncomingShare100: boolean;
  errors: string[];
  warnings: string[];
}

export interface MultiCarrierSimulationOutput {
  id?: string;
  name: string;
  description?: string;
  outgoingMinutes: number;
  incomingMinutes: number;
  outgoingRevenueRate: number;
  validation: SimulationValidationResult;
  carrierResults: CarrierSimulationOutput[];
  totals: {
    totalIncomingTraffic: number;
    totalOutgoingTraffic: number;
    totalIncomingRevenue: number;
    totalSubscriberRevenue: number;
    totalRevenue: number;
    totalWholesaleCost: number;
    totalCost: number;
    netProfit: number;
    profitMarginPct: number;
  };
}

// -----------------------------------------------------------------
// Phase 2: Final Scenario & Variance Analysis Types
// -----------------------------------------------------------------

export interface ScenarioVarianceMetrics {
  targetSimulationId: string;
  targetSimulationName: string;
  revenueDiff: number;
  costDiff: number;
  netProfitDiff: number;
  marginPctDiff: number;
  incomingTrafficDiff: number;
  outgoingTrafficDiff: number;
}

export interface FinalScenarioOutput {
  id?: string;
  name: string;
  description?: string;
  sourceSimulationId?: string;
  outgoingMinutes: number;
  incomingMinutes: number;
  outgoingRevenueRate: number;
  validation: SimulationValidationResult;
  carrierResults: CarrierSimulationOutput[];
  totals: {
    totalIncomingTraffic: number;
    totalOutgoingTraffic: number;
    totalIncomingRevenue: number;
    totalSubscriberRevenue: number;
    totalRevenue: number;
    totalWholesaleCost: number;
    totalCost: number;
    netProfit: number;
    profitMarginPct: number;
  };
  variances: ScenarioVarianceMetrics[];
}


