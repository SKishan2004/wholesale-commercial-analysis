import Decimal from 'decimal.js';
import {
  CommercialCalculationInput,
  CommercialCalculationOutput,
  CommercialCalculationConfig
} from './types';

/**
 * Calculates wholesale commercial analytics dynamically based on input parameters.
 * Uses Decimal.js for precise financial and traffic volume calculations.
 */
export function calculateCommercialPerformance(
  input: CommercialCalculationInput,
  config: CommercialCalculationConfig = {}
): CommercialCalculationOutput {
  const {
    includeGranularVariableCosts = true,
    includeFixedCostsInNetProfit = true
  } = config;

  // Convert inputs to Decimal
  const outgoingMins = new Decimal(input.outgoingMinutes || 0);
  const incomingMins = new Decimal(input.incomingMinutes || 0);

  // Shares can be provided as percentages (e.g. 60 or 0.60)
  const outgoingShare = new Decimal(input.outgoingShare > 1 ? input.outgoingShare / 100 : input.outgoingShare || 0);
  const incomingShare = new Decimal(input.incomingShare > 1 ? input.incomingShare / 100 : input.incomingShare || 0);

  const incomingRevRate = new Decimal(input.incomingRevenueRate > 1 && input.incomingRevenueRate <= 100 
    ? input.incomingRevenueRate / 100 
    : input.incomingRevenueRate || 0);
  
  const outgoingCostRate = new Decimal(input.outgoingCostRate > 1 && input.outgoingCostRate <= 100
    ? input.outgoingCostRate / 100
    : input.outgoingCostRate || 0);

  const outgoingRevRate = new Decimal(input.outgoingRevenueRate || 0);

  // FX Rate factor (default 1.0)
  const fxRate = new Decimal(input.fxRateToReport || 1.0);

  // 1. Calculated Traffic Volumes
  const calculatedOutgoingTraffic = outgoingMins.times(outgoingShare);
  const calculatedIncomingTraffic = incomingMins.times(incomingShare);

  // 2. Calculated Revenues
  const incomingRevenue = calculatedIncomingTraffic.times(incomingRevRate).times(fxRate);
  const subscriberRevenue = calculatedOutgoingTraffic.times(outgoingRevRate).times(fxRate);
  const totalRevenue = incomingRevenue.plus(subscriberRevenue);

  // 3. Calculated Wholesale Base Cost
  const wholesaleCost = calculatedOutgoingTraffic.times(outgoingCostRate).times(fxRate);

  // Optional Granular Unit Costs (interconnect, transit, termination)
  let granularVariableCosts = new Decimal(0);
  if (includeGranularVariableCosts) {
    const interconnect = new Decimal(input.interconnectCostRate || 0);
    const termination = new Decimal(input.terminationCostRate || 0);
    const transit = new Decimal(input.transitCostRate || 0);
    const totalGranularRate = interconnect.plus(termination).plus(transit);
    granularVariableCosts = calculatedOutgoingTraffic.times(totalGranularRate).times(fxRate);
  }

  const totalVariableCost = wholesaleCost.plus(granularVariableCosts);

  // Optional Fixed / Operational Costs
  let totalFixedCost = new Decimal(0);
  if (includeFixedCostsInNetProfit) {
    const cable = new Decimal(input.cableCapacityCost || 0);
    const settlement = new Decimal(input.settlementCost || 0);
    const tax = new Decimal(input.regulatoryTaxCost || 0);
    const otherOps = new Decimal(input.otherOperatingCost || 0);
    totalFixedCost = cable.plus(settlement).plus(tax).plus(otherOps).times(fxRate);
  }

  const totalCost = totalVariableCost.plus(totalFixedCost);

  // 4. Profitability Outputs
  const grossProfit = totalRevenue.minus(totalVariableCost);
  const netProfit = totalRevenue.minus(totalCost);

  const profitMarginPct = totalRevenue.isZero()
    ? new Decimal(0)
    : netProfit.dividedBy(totalRevenue).times(100);

  // Unit Metrics
  const avgRevPerMin = calculatedOutgoingTraffic.isZero()
    ? new Decimal(0)
    : totalRevenue.dividedBy(calculatedOutgoingTraffic);

  const avgCostPerMin = calculatedOutgoingTraffic.isZero()
    ? new Decimal(0)
    : totalCost.dividedBy(calculatedOutgoingTraffic);

  // Break-even subscriber price per minute (where Total Revenue = Total Cost)
  // Total Revenue = (Incoming Revenue) + (Outgoing Traffic * Price)
  // Break-Even Price = (Total Cost - Incoming Revenue) / Outgoing Traffic
  let breakEvenSubscriberRate = new Decimal(0);
  if (!calculatedOutgoingTraffic.isZero()) {
    const netCostToCover = totalCost.minus(incomingRevenue);
    breakEvenSubscriberRate = netCostToCover.dividedBy(calculatedOutgoingTraffic);
  }

  return {
    calculatedOutgoingTraffic: calculatedOutgoingTraffic.toNumber(),
    calculatedIncomingTraffic: calculatedIncomingTraffic.toNumber(),
    incomingRevenue: incomingRevenue.toDecimalPlaces(2).toNumber(),
    subscriberRevenue: subscriberRevenue.toDecimalPlaces(2).toNumber(),
    totalRevenue: totalRevenue.toDecimalPlaces(2).toNumber(),
    wholesaleCost: wholesaleCost.toDecimalPlaces(2).toNumber(),
    totalVariableCost: totalVariableCost.toDecimalPlaces(2).toNumber(),
    totalFixedCost: totalFixedCost.toDecimalPlaces(2).toNumber(),
    totalCost: totalCost.toDecimalPlaces(2).toNumber(),
    grossProfit: grossProfit.toDecimalPlaces(2).toNumber(),
    netProfit: netProfit.toDecimalPlaces(2).toNumber(),
    profitMarginPct: profitMarginPct.toDecimalPlaces(2).toNumber(),
    avgRevenuePerOutgoingMin: avgRevPerMin.toDecimalPlaces(4).toNumber(),
    avgCostPerOutgoingMin: avgCostPerMin.toDecimalPlaces(4).toNumber(),
    breakEvenSubscriberRate: breakEvenSubscriberRate.toDecimalPlaces(4).toNumber()
  };
}

// -----------------------------------------------------------------
// Dynamic Multi-Carrier Commercial Simulation Engine (Phase 1 Workspace)
// -----------------------------------------------------------------

import {
  CarrierSimulationInput,
  CarrierSimulationOutput,
  MultiCarrierSimulationInput,
  MultiCarrierSimulationOutput,
  SimulationValidationResult
} from './types';

export function calculateMultiCarrierSimulation(
  input: MultiCarrierSimulationInput
): MultiCarrierSimulationOutput {
  const outgoingMins = new Decimal(Math.max(0, input.outgoingMinutes || 0));
  const incomingMins = new Decimal(Math.max(0, input.incomingMinutes || 0));
  const outgoingRevRate = new Decimal(Math.max(0, input.outgoingRevenueRate || 0));

  const carriers = input.carriers || [];
  const errors: string[] = [];
  const warnings: string[] = [];

  if (input.outgoingMinutes < 0) errors.push('Total outgoing minutes cannot be negative.');
  if (input.incomingMinutes < 0) errors.push('Total incoming minutes cannot be negative.');
  if (input.outgoingRevenueRate < 0) errors.push('Outgoing revenue rate cannot be negative.');

  let totalOutShareSum = new Decimal(0);
  let totalIncShareSum = new Decimal(0);

  // Validate carrier inputs and compute share sums
  carriers.forEach((c, idx) => {
    const name = (c.carrierName || '').trim();
    if (!name) {
      errors.push(`Carrier #${idx + 1} name is required.`);
    }

    const outSharePct = c.outgoingShare > 1 ? c.outgoingShare : c.outgoingShare * 100;
    const incSharePct = c.incomingShare > 1 ? c.incomingShare : c.incomingShare * 100;

    if (outSharePct < 0) errors.push(`Carrier "${name || idx + 1}" outgoing share cannot be negative.`);
    if (incSharePct < 0) errors.push(`Carrier "${name || idx + 1}" incoming share cannot be negative.`);
    if (c.incomingRevenueRate < 0) errors.push(`Carrier "${name || idx + 1}" incoming revenue rate cannot be negative.`);
    if (c.outgoingCostRate < 0) errors.push(`Carrier "${name || idx + 1}" outgoing cost rate cannot be negative.`);

    totalOutShareSum = totalOutShareSum.plus(outSharePct);
    totalIncShareSum = totalIncShareSum.plus(incSharePct);
  });

  const totalOutSharePctVal = totalOutShareSum.toDecimalPlaces(2).toNumber();
  const totalIncSharePctVal = totalIncShareSum.toDecimalPlaces(2).toNumber();

  const isOutgoingShare100 = Math.abs(totalOutSharePctVal - 100) < 0.01;
  const isIncomingShare100 = Math.abs(totalIncSharePctVal - 100) < 0.01;

  if (carriers.length > 0 && !isOutgoingShare100) {
    warnings.push(`Outgoing share total is ${totalOutSharePctVal}%. Standard allocation totals 100%.`);
  }
  if (carriers.length > 0 && !isIncomingShare100) {
    warnings.push(`Incoming share total is ${totalIncSharePctVal}%. Standard allocation totals 100%.`);
  }

  const validation: SimulationValidationResult = {
    isValid: errors.length === 0,
    totalOutgoingSharePct: totalOutSharePctVal,
    totalIncomingSharePct: totalIncSharePctVal,
    isOutgoingShare100,
    isIncomingShare100,
    errors,
    warnings
  };

  // Perform per-carrier calculations
  let totIncTraffic = new Decimal(0);
  let totOutTraffic = new Decimal(0);
  let totIncRev = new Decimal(0);
  let totSubRev = new Decimal(0);
  let totRev = new Decimal(0);
  let totCost = new Decimal(0);

  const carrierResults: CarrierSimulationOutput[] = carriers.map(c => {
    const outShareRatio = new Decimal(c.outgoingShare > 1 ? c.outgoingShare / 100 : c.outgoingShare || 0);
    const incShareRatio = new Decimal(c.incomingShare > 1 ? c.incomingShare / 100 : c.incomingShare || 0);

    const incRevRate = new Decimal(c.incomingRevenueRate || 0);
    const outCostRate = new Decimal(c.outgoingCostRate || 0);

    // Dynamic Traffic Allocation
    const calcOutTraffic = outgoingMins.times(outShareRatio);
    const calcIncTraffic = incomingMins.times(incShareRatio);

    // Revenue Calculations
    const incRev = calcIncTraffic.times(incRevRate);
    const subRev = calcOutTraffic.times(outgoingRevRate);
    const cTotalRev = incRev.plus(subRev);

    // Cost Calculation
    const cWholesaleCost = calcOutTraffic.times(outCostRate);

    // Profitability
    const cNetProfit = cTotalRev.minus(cWholesaleCost);
    const cMarginPct = cTotalRev.isZero()
      ? new Decimal(0)
      : cNetProfit.dividedBy(cTotalRev).times(100);

    // Accumulate overall totals
    totOutTraffic = totOutTraffic.plus(calcOutTraffic);
    totIncTraffic = totIncTraffic.plus(calcIncTraffic);
    totIncRev = totIncRev.plus(incRev);
    totSubRev = totSubRev.plus(subRev);
    totRev = totRev.plus(cTotalRev);
    totCost = totCost.plus(cWholesaleCost);

    return {
      id: c.id,
      carrierName: c.carrierName || 'Unnamed Carrier',
      outgoingSharePct: c.outgoingShare > 1 ? c.outgoingShare : c.outgoingShare * 100,
      incomingSharePct: c.incomingShare > 1 ? c.incomingShare : c.incomingShare * 100,
      incomingRevenueRate: incRevRate.toNumber(),
      outgoingCostRate: outCostRate.toNumber(),
      calculatedOutgoingTraffic: calcOutTraffic.toNumber(),
      calculatedIncomingTraffic: calcIncTraffic.toNumber(),
      incomingRevenue: incRev.toDecimalPlaces(2).toNumber(),
      subscriberRevenue: subRev.toDecimalPlaces(2).toNumber(),
      totalRevenue: cTotalRev.toDecimalPlaces(2).toNumber(),
      wholesaleCost: cWholesaleCost.toDecimalPlaces(2).toNumber(),
      netProfit: cNetProfit.toDecimalPlaces(2).toNumber(),
      profitMarginPct: cMarginPct.toDecimalPlaces(2).toNumber()
    };
  });

  const overallNetProfit = totRev.minus(totCost);
  const overallMarginPct = totRev.isZero()
    ? new Decimal(0)
    : overallNetProfit.dividedBy(totRev).times(100);

  return {
    id: input.id,
    name: input.name || 'Commercial Simulation Scenario',
    description: input.description || '',
    outgoingMinutes: outgoingMins.toNumber(),
    incomingMinutes: incomingMins.toNumber(),
    outgoingRevenueRate: outgoingRevRate.toNumber(),
    validation,
    carrierResults,
    totals: {
      totalIncomingTraffic: totIncTraffic.toNumber(),
      totalOutgoingTraffic: totOutTraffic.toNumber(),
      totalIncomingRevenue: totIncRev.toDecimalPlaces(2).toNumber(),
      totalSubscriberRevenue: totSubRev.toDecimalPlaces(2).toNumber(),
      totalRevenue: totRev.toDecimalPlaces(2).toNumber(),
      totalWholesaleCost: totCost.toDecimalPlaces(2).toNumber(),
      totalCost: totCost.toDecimalPlaces(2).toNumber(),
      netProfit: overallNetProfit.toDecimalPlaces(2).toNumber(),
      profitMarginPct: overallMarginPct.toDecimalPlaces(2).toNumber()
    }
  };
}

