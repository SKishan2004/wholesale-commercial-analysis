import { describe, it, expect } from 'vitest';
import {
  calculateCommercialPerformance,
  calculateMultiCarrierSimulation
} from '../calculation/calculationEngine';

describe('Wholesale Commercial Calculation Engine', () => {
  it('should accurately calculate the manager baseline example', () => {
    const input = {
      outgoingMinutes: 100000,
      incomingMinutes: 200000,
      outgoingShare: 0.60,       // 60%
      incomingShare: 0.50,       // 50%
      incomingRevenueRate: 0.50, // 50%
      outgoingCostRate: 0.70,    // 70%
      outgoingRevenueRate: 1.0   // ₹1 per min
    };

    const result = calculateCommercialPerformance(input);

    expect(result.calculatedOutgoingTraffic).toBe(60000);
    expect(result.calculatedIncomingTraffic).toBe(100000);
    expect(result.incomingRevenue).toBe(50000);
    expect(result.wholesaleCost).toBe(42000);
    expect(result.subscriberRevenue).toBe(60000);
    expect(result.totalRevenue).toBe(110000);
    expect(result.totalCost).toBe(42000);
    expect(result.netProfit).toBe(68000);
    expect(result.profitMarginPct).toBe(61.82);
  });

  it('should handle percentage input formats (e.g. 60 instead of 0.60)', () => {
    const input = {
      outgoingMinutes: 100000,
      incomingMinutes: 200000,
      outgoingShare: 60,       // 60%
      incomingShare: 50,       // 50%
      incomingRevenueRate: 50, // 50%
      outgoingCostRate: 70,    // 70%
      outgoingRevenueRate: 1.0
    };

    const result = calculateCommercialPerformance(input);

    expect(result.calculatedOutgoingTraffic).toBe(60000);
    expect(result.calculatedIncomingTraffic).toBe(100000);
    expect(result.incomingRevenue).toBe(50000);
    expect(result.wholesaleCost).toBe(42000);
    expect(result.subscriberRevenue).toBe(60000);
    expect(result.netProfit).toBe(68000);
  });

  it('should handle loss scenarios correctly', () => {
    const input = {
      outgoingMinutes: 100000,
      incomingMinutes: 50000,
      outgoingShare: 1.0,
      incomingShare: 1.0,
      incomingRevenueRate: 0.10, // ₹0.10 per min -> ₹5,000
      outgoingCostRate: 0.90,    // ₹0.90 per min -> ₹90,000 cost
      outgoingRevenueRate: 0.50  // ₹0.50 per min -> ₹50,000 rev
    };

    const result = calculateCommercialPerformance(input);

    // Total Rev = 5000 + 50000 = 55000
    // Total Cost = 90000
    // Net Profit = 55000 - 90000 = -35000 (Loss)
    expect(result.totalRevenue).toBe(55000);
    expect(result.totalCost).toBe(90000);
    expect(result.netProfit).toBe(-35000);
    expect(result.profitMarginPct).toBe(-63.64);
  });

  it('should calculate break-even subscriber rate correctly', () => {
    const input = {
      outgoingMinutes: 100000,
      incomingMinutes: 200000,
      outgoingShare: 0.60,       // 60,000 mins
      incomingShare: 0.50,       // 100,000 mins
      incomingRevenueRate: 0.50, // ₹50,000 incoming rev
      outgoingCostRate: 0.70,    // ₹42,000 total cost
      outgoingRevenueRate: 0     // No subscriber revenue yet
    };

    const result = calculateCommercialPerformance(input);

    // Incoming Revenue (50,000) already exceeds Total Cost (42,000)
    // So break even subscriber rate is negative / 0 (already profitable even at ₹0 subscriber price)
    expect(result.breakEvenSubscriberRate).toBe(-0.1333);
  });

  it('should include optional granular unit costs when specified', () => {
    const input = {
      outgoingMinutes: 100000,
      incomingMinutes: 200000,
      outgoingShare: 0.60,        // 60,000 mins
      incomingShare: 0.50,
      incomingRevenueRate: 0.50,
      outgoingCostRate: 0.70,     // ₹42,000
      outgoingRevenueRate: 1.0,   // ₹60,000
      interconnectCostRate: 0.05, // 60,000 * 0.05 = ₹3,000
      cableCapacityCost: 5000     // ₹5,000 fixed
    };

    const result = calculateCommercialPerformance(input);

    expect(result.wholesaleCost).toBe(42000);
    expect(result.totalVariableCost).toBe(45000); // 42000 + 3000
    expect(result.totalFixedCost).toBe(5000);
    expect(result.totalCost).toBe(50000); // 45000 + 5000
    expect(result.netProfit).toBe(60000); // 110000 - 50000
  });
});

describe('Multi-Carrier Commercial Simulation Engine (Phase 1)', () => {
  it('should calculate the manager sample example with Carrier A and Carrier B correctly', () => {
    const input = {
      outgoingMinutes: 100000,
      incomingMinutes: 200000,
      outgoingRevenueRate: 1.0,
      carriers: [
        {
          carrierName: 'Carrier A',
          outgoingShare: 60,       // 60%
          incomingShare: 50,       // 50%
          incomingRevenueRate: 0.50,
          outgoingCostRate: 0.70
        },
        {
          carrierName: 'Carrier B',
          outgoingShare: 40,       // 40%
          incomingShare: 50,       // 50%
          incomingRevenueRate: 0.40,
          outgoingCostRate: 0.60
        }
      ]
    };

    const result = calculateMultiCarrierSimulation(input);

    expect(result.validation.isValid).toBe(true);
    expect(result.validation.isOutgoingShare100).toBe(true);
    expect(result.validation.isIncomingShare100).toBe(true);

    // Carrier A verification
    const carrierA = result.carrierResults.find(c => c.carrierName === 'Carrier A')!;
    expect(carrierA.calculatedOutgoingTraffic).toBe(60000);
    expect(carrierA.calculatedIncomingTraffic).toBe(100000);
    expect(carrierA.incomingRevenue).toBe(50000);
    expect(carrierA.subscriberRevenue).toBe(60000);
    expect(carrierA.totalRevenue).toBe(110000);
    expect(carrierA.wholesaleCost).toBe(42000);
    expect(carrierA.netProfit).toBe(68000);
    expect(carrierA.profitMarginPct).toBe(61.82);

    // Carrier B verification
    const carrierB = result.carrierResults.find(c => c.carrierName === 'Carrier B')!;
    expect(carrierB.calculatedOutgoingTraffic).toBe(40000);
    expect(carrierB.calculatedIncomingTraffic).toBe(100000);
    expect(carrierB.incomingRevenue).toBe(40000);
    expect(carrierB.subscriberRevenue).toBe(40000);
    expect(carrierB.totalRevenue).toBe(80000);
    expect(carrierB.wholesaleCost).toBe(24000);
    expect(carrierB.netProfit).toBe(56000);
    expect(carrierB.profitMarginPct).toBe(70.00);

    // Overall Simulation Totals verification
    expect(result.totals.totalOutgoingTraffic).toBe(100000);
    expect(result.totals.totalIncomingTraffic).toBe(200000);
    expect(result.totals.totalIncomingRevenue).toBe(90000);
    expect(result.totals.totalSubscriberRevenue).toBe(100000);
    expect(result.totals.totalRevenue).toBe(190000);
    expect(result.totals.totalWholesaleCost).toBe(66000);
    expect(result.totals.totalCost).toBe(66000);
    expect(result.totals.netProfit).toBe(124000);
    expect(result.totals.profitMarginPct).toBe(65.26);
  });

  it('should support dynamic 3+ carriers and calculate correct sums', () => {
    const input = {
      outgoingMinutes: 150000,
      incomingMinutes: 300000,
      outgoingRevenueRate: 1.20,
      carriers: [
        { carrierName: 'Carrier X', outgoingShare: 50, incomingShare: 40, incomingRevenueRate: 0.60, outgoingCostRate: 0.80 },
        { carrierName: 'Carrier Y', outgoingShare: 30, incomingShare: 40, incomingRevenueRate: 0.50, outgoingCostRate: 0.70 },
        { carrierName: 'Carrier Z', outgoingShare: 20, incomingShare: 20, incomingRevenueRate: 0.40, outgoingCostRate: 0.65 }
      ]
    };

    const result = calculateMultiCarrierSimulation(input);

    expect(result.carrierResults.length).toBe(3);
    expect(result.validation.isOutgoingShare100).toBe(true);
    expect(result.validation.isIncomingShare100).toBe(true);
    expect(result.totals.totalOutgoingTraffic).toBe(150000);
    expect(result.totals.totalIncomingTraffic).toBe(300000);
  });

  it('should detect share total mismatches and flag clear validation warnings', () => {
    const input = {
      outgoingMinutes: 100000,
      incomingMinutes: 200000,
      outgoingRevenueRate: 1.0,
      carriers: [
        { carrierName: 'Carrier A', outgoingShare: 50, incomingShare: 40, incomingRevenueRate: 0.50, outgoingCostRate: 0.70 },
        { carrierName: 'Carrier B', outgoingShare: 40, incomingShare: 50, incomingRevenueRate: 0.40, outgoingCostRate: 0.60 }
      ]
    };

    const result = calculateMultiCarrierSimulation(input);

    expect(result.validation.totalOutgoingSharePct).toBe(90);
    expect(result.validation.totalIncomingSharePct).toBe(90);
    expect(result.validation.isOutgoingShare100).toBe(false);
    expect(result.validation.isIncomingShare100).toBe(false);
    expect(result.validation.warnings.length).toBeGreaterThan(0);
  });
});

