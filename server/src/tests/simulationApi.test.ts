import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '../db/prismaClient';
import {
  getAllSimulations,
  createSimulation,
  updateSimulation,
  duplicateSimulation,
  deleteSimulation
} from '../services/simulationRepository';
import { calculateMultiCarrierSimulation } from '../calculation/calculationEngine';

describe('Phase 1 - Carrier Allocation & Simulation Integration Tests', () => {
  beforeAll(async () => {
    // Clean simulation table before running integration tests
    await prisma.simulationCarrierInput.deleteMany({});
    await prisma.commercialSimulation.deleteMany({});
  });

  it('1-7. Manager Sample Verification (Traffic, Revenue, Cost, Profit, Margin)', () => {
    const input = {
      outgoingMinutes: 100000,
      incomingMinutes: 200000,
      outgoingRevenueRate: 1.0,
      carriers: [
        {
          carrierName: 'Carrier A',
          outgoingShare: 60,
          incomingShare: 50,
          incomingRevenueRate: 0.50,
          outgoingCostRate: 0.70
        },
        {
          carrierName: 'Carrier B',
          outgoingShare: 40,
          incomingShare: 50,
          incomingRevenueRate: 0.40,
          outgoingCostRate: 0.60
        }
      ]
    };

    const output = calculateMultiCarrierSimulation(input);

    // 2. Outgoing Traffic Allocation
    const carrierA = output.carrierResults.find(c => c.carrierName === 'Carrier A')!;
    const carrierB = output.carrierResults.find(c => c.carrierName === 'Carrier B')!;
    expect(carrierA.calculatedOutgoingTraffic).toBe(60000);
    expect(carrierB.calculatedOutgoingTraffic).toBe(40000);

    // 3. Incoming Traffic Allocation
    expect(carrierA.calculatedIncomingTraffic).toBe(100000);
    expect(carrierB.calculatedIncomingTraffic).toBe(100000);

    // 4. Revenue
    expect(carrierA.incomingRevenue).toBe(50000);
    expect(carrierA.subscriberRevenue).toBe(60000);
    expect(carrierA.totalRevenue).toBe(110000);
    expect(carrierB.incomingRevenue).toBe(40000);
    expect(carrierB.subscriberRevenue).toBe(40000);
    expect(carrierB.totalRevenue).toBe(80000);
    expect(output.totals.totalRevenue).toBe(190000);

    // 5. Cost
    expect(carrierA.wholesaleCost).toBe(42000);
    expect(carrierB.wholesaleCost).toBe(24000);
    expect(output.totals.totalWholesaleCost).toBe(66000);

    // 6. Net Profit
    expect(carrierA.netProfit).toBe(68000);
    expect(carrierB.netProfit).toBe(56000);
    expect(output.totals.netProfit).toBe(124000);

    // 7. Profit Margin
    expect(carrierA.profitMarginPct).toBe(61.82);
    expect(carrierB.profitMarginPct).toBe(70.00);
    expect(output.totals.profitMarginPct).toBe(65.26);
  });

  it('8. Test 2 carriers initialization in database', async () => {
    const sim1 = await createSimulation({
      name: 'Simulation 1',
      outgoingMinutes: 100000,
      incomingMinutes: 200000,
      outgoingRevenueRate: 1.0,
      carriers: [
        { carrierName: 'Carrier A', outgoingShare: 60, incomingShare: 50, incomingRevenueRate: 0.50, outgoingCostRate: 0.70 },
        { carrierName: 'Carrier B', outgoingShare: 40, incomingShare: 50, incomingRevenueRate: 0.40, outgoingCostRate: 0.60 }
      ]
    });

    expect(sim1.id).toBeDefined();
    expect(sim1.carrierResults.length).toBe(2);
    expect(sim1.totals.netProfit).toBe(124000);
  });

  it('9. Test 3+ carriers creation in database', async () => {
    const sim2 = await createSimulation({
      name: 'Simulation 2',
      outgoingMinutes: 120000,
      incomingMinutes: 240000,
      outgoingRevenueRate: 1.10,
      carriers: [
        { carrierName: 'Carrier A', outgoingShare: 50, incomingShare: 40, incomingRevenueRate: 0.50, outgoingCostRate: 0.70 },
        { carrierName: 'Carrier B', outgoingShare: 30, incomingShare: 40, incomingRevenueRate: 0.45, outgoingCostRate: 0.65 },
        { carrierName: 'Carrier C', outgoingShare: 20, incomingShare: 20, incomingRevenueRate: 0.35, outgoingCostRate: 0.55 }
      ]
    });

    expect(sim2.carrierResults.length).toBe(3);
    expect(sim2.totals.totalOutgoingTraffic).toBe(120000);
    expect(sim2.totals.totalIncomingTraffic).toBe(240000);
  });

  it('10. Test changing carrier shares', async () => {
    const allSims = await getAllSimulations();
    const sim1 = allSims[0];

    const updated = await updateSimulation(sim1.id!, {
      name: 'Simulation 1 Updated',
      outgoingMinutes: 100000,
      incomingMinutes: 200000,
      outgoingRevenueRate: 1.0,
      carriers: [
        { carrierName: 'Carrier A', outgoingShare: 70, incomingShare: 50, incomingRevenueRate: 0.50, outgoingCostRate: 0.70 },
        { carrierName: 'Carrier B', outgoingShare: 30, incomingShare: 50, incomingRevenueRate: 0.40, outgoingCostRate: 0.60 }
      ]
    });

    const carrierA = updated.carrierResults.find(c => c.carrierName === 'Carrier A')!;
    expect(carrierA.calculatedOutgoingTraffic).toBe(70000);
    expect(carrierA.wholesaleCost).toBe(49000);
  });

  it('11. Test invalid shares validation detection', () => {
    const output = calculateMultiCarrierSimulation({
      outgoingMinutes: 100000,
      incomingMinutes: 200000,
      outgoingRevenueRate: 1.0,
      carriers: [
        { carrierName: 'Carrier A', outgoingShare: 50, incomingShare: 40, incomingRevenueRate: 0.50, outgoingCostRate: 0.70 },
        { carrierName: 'Carrier B', outgoingShare: 40, incomingShare: 40, incomingRevenueRate: 0.40, outgoingCostRate: 0.60 }
      ]
    });

    expect(output.validation.isOutgoingShare100).toBe(false);
    expect(output.validation.isIncomingShare100).toBe(false);
    expect(output.validation.totalOutgoingSharePct).toBe(90);
    expect(output.validation.totalIncomingSharePct).toBe(80);
    expect(output.validation.warnings.length).toBeGreaterThan(0);
  });

  it('12. Test that Simulation 1 does not affect Simulation 2', async () => {
    const allSims = await getAllSimulations();
    const sim1 = allSims[0];
    const sim2 = allSims[1];

    const initialSim2Profit = sim2.totals.netProfit;

    // Mutate Simulation 1
    await updateSimulation(sim1.id!, {
      name: 'Simulation 1 Mutated',
      outgoingMinutes: 500000,
      incomingMinutes: 500000,
      outgoingRevenueRate: 2.0,
      carriers: [
        { carrierName: 'Carrier A', outgoingShare: 100, incomingShare: 100, incomingRevenueRate: 1.0, outgoingCostRate: 0.5 }
      ]
    });

    // Verify Simulation 2 is completely unchanged
    const reFetchedSims = await getAllSimulations();
    const reFetchedSim2 = reFetchedSims.find(s => s.id === sim2.id)!;

    expect(reFetchedSim2.totals.netProfit).toBe(initialSim2Profit);
  });

  it('13. Test that simulation changes do not modify historical daily-log records', async () => {
    const historicalRecordCountBefore = await prisma.trafficCommercialRecord.count();

    // Create and delete simulations
    const newSim = await createSimulation({
      name: 'Temporary Simulation 3',
      outgoingMinutes: 999999,
      incomingMinutes: 999999,
      outgoingRevenueRate: 5.0,
      carriers: [
        { carrierName: 'Temp Carrier', outgoingShare: 100, incomingShare: 100, incomingRevenueRate: 2.0, outgoingCostRate: 1.0 }
      ]
    });

    await deleteSimulation(newSim.id!);

    const historicalRecordCountAfter = await prisma.trafficCommercialRecord.count();
    expect(historicalRecordCountAfter).toBe(historicalRecordCountBefore);
  });
});
