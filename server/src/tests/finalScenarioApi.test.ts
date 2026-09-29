import { describe, it, expect, beforeAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { calculateMultiCarrierSimulation } from '../calculation/calculationEngine';
import {
  getFinalScenario,
  updateFinalScenario,
  copySimulationToFinalScenario
} from '../services/finalScenarioRepository';

const prisma = new PrismaClient();

describe('Phase 2 - Final Scenario & Comparison API Integration Tests', () => {
  let sim1Id: string;
  let sim2Id: string;
  let sim3Id: string;

  beforeAll(async () => {
    // Clean up any test records from DB
    await prisma.finalScenarioCarrierInput.deleteMany({});
    await prisma.finalCommercialScenario.deleteMany({});
    await prisma.simulationCarrierInput.deleteMany({});
    await prisma.commercialSimulation.deleteMany({});

    // 1. Create Simulation 1
    const sim1 = await prisma.commercialSimulation.create({
      data: {
        name: 'Simulation 1',
        outgoingMinutes: 100000,
        incomingMinutes: 200000,
        outgoingRevenueRate: 1.0,
        carriers: {
          create: [
            { carrierName: 'Carrier A', outgoingShare: 60, incomingShare: 50, incomingRevenueRate: 0.50, outgoingCostRate: 0.70 },
            { carrierName: 'Carrier B', outgoingShare: 40, incomingShare: 50, incomingRevenueRate: 0.40, outgoingCostRate: 0.60 }
          ]
        }
      }
    });
    sim1Id = sim1.id;

    // 2. Create Simulation 2
    const sim2 = await prisma.commercialSimulation.create({
      data: {
        name: 'Simulation 2',
        outgoingMinutes: 120000,
        incomingMinutes: 220000,
        outgoingRevenueRate: 1.1,
        carriers: {
          create: [
            { carrierName: 'Carrier A', outgoingShare: 50, incomingShare: 40, incomingRevenueRate: 0.55, outgoingCostRate: 0.65 },
            { carrierName: 'Carrier B', outgoingShare: 50, incomingShare: 60, incomingRevenueRate: 0.45, outgoingCostRate: 0.55 }
          ]
        }
      }
    });
    sim2Id = sim2.id;

    // 3. Create Simulation 3
    const sim3 = await prisma.commercialSimulation.create({
      data: {
        name: 'Simulation 3',
        outgoingMinutes: 150000,
        incomingMinutes: 250000,
        outgoingRevenueRate: 1.2,
        carriers: {
          create: [
            { carrierName: 'Carrier A', outgoingShare: 70, incomingShare: 60, incomingRevenueRate: 0.60, outgoingCostRate: 0.75 },
            { carrierName: 'Carrier B', outgoingShare: 30, incomingShare: 40, incomingRevenueRate: 0.35, outgoingCostRate: 0.50 }
          ]
        }
      }
    });
    sim3Id = sim3.id;
  });

  it('1. Fetches or initializes default Final Scenario without error', async () => {
    const finalScen = await getFinalScenario();
    expect(finalScen).toBeDefined();
    expect(finalScen.name).toBe('Final Commercial Scenario');
    expect(finalScen.carrierResults.length).toBeGreaterThan(0);
    expect(finalScen.totals).toBeDefined();
  });

  it('2. Copies Simulation 1 into Final Scenario independently', async () => {
    const result = await copySimulationToFinalScenario(sim1Id);
    expect(result.sourceSimulationId).toBe(sim1Id);
    expect(result.outgoingMinutes).toBe(100000);
    expect(result.incomingMinutes).toBe(200000);
    expect(result.carrierResults.length).toBe(2);

    const carrierA = result.carrierResults.find(c => c.carrierName === 'Carrier A');
    expect(carrierA).toBeDefined();
    expect(carrierA?.outgoingSharePct).toBe(60);
    expect(carrierA?.incomingSharePct).toBe(50);
  });

  it('3. Copies Simulation 2 into Final Scenario and updates values', async () => {
    const result = await copySimulationToFinalScenario(sim2Id);
    expect(result.sourceSimulationId).toBe(sim2Id);
    expect(result.outgoingMinutes).toBe(120000);
    expect(result.incomingMinutes).toBe(220000);
    expect(result.outgoingRevenueRate).toBe(1.1);

    const carrierA = result.carrierResults.find(c => c.carrierName === 'Carrier A');
    expect(carrierA?.outgoingSharePct).toBe(50);
    expect(carrierA?.incomingSharePct).toBe(40);
  });

  it('4. Copies Simulation 3 into Final Scenario', async () => {
    const result = await copySimulationToFinalScenario(sim3Id);
    expect(result.sourceSimulationId).toBe(sim3Id);
    expect(result.outgoingMinutes).toBe(150000);
    expect(result.incomingMinutes).toBe(250000);
  });

  it('5. Modifies Final Scenario without altering original simulations', async () => {
    const updated = await updateFinalScenario({
      name: 'Custom Consolidated Scenario',
      outgoingMinutes: 130000,
      incomingMinutes: 230000,
      outgoingRevenueRate: 1.05,
      carriers: [
        { carrierName: 'Carrier A', outgoingShare: 55, incomingShare: 45, incomingRevenueRate: 0.52, outgoingCostRate: 0.68 },
        { carrierName: 'Carrier B', outgoingShare: 45, incomingShare: 55, incomingRevenueRate: 0.42, outgoingCostRate: 0.58 }
      ]
    });

    expect(updated.name).toBe('Custom Consolidated Scenario');
    expect(updated.outgoingMinutes).toBe(130000);

    // Verify original Simulation 1 is untouched
    const origSim1 = await prisma.commercialSimulation.findUnique({
      where: { id: sim1Id },
      include: { carriers: true }
    });
    expect(origSim1?.outgoingMinutes).toBe(100000);

    // Verify original Simulation 2 is untouched
    const origSim2 = await prisma.commercialSimulation.findUnique({
      where: { id: sim2Id }
    });
    expect(origSim2?.outgoingMinutes).toBe(120000);
  });

  it('6. Computes neutral variance metrics against all simulations', async () => {
    const finalScen = await getFinalScenario();
    expect(finalScen.variances).toBeDefined();
    expect(finalScen.variances.length).toBe(3);

    finalScen.variances.forEach(v => {
      expect(typeof v.revenueDiff).toBe('number');
      expect(typeof v.costDiff).toBe('number');
      expect(typeof v.netProfitDiff).toBe('number');
      expect(typeof v.marginPctDiff).toBe('number');
      expect(v.targetSimulationName).toContain('Simulation');
    });
  });

  it('7. Validates missing inputs and non-100% share warnings strictly', async () => {
    const invalidInput = await updateFinalScenario({
      name: 'Invalid Scenario Test',
      outgoingMinutes: 100000,
      incomingMinutes: 200000,
      outgoingRevenueRate: 1.0,
      carriers: [
        { carrierName: 'Carrier X', outgoingShare: 40, incomingShare: 30, incomingRevenueRate: 0.5, outgoingCostRate: 0.5 },
        { carrierName: 'Carrier Y', outgoingShare: 40, incomingShare: 30, incomingRevenueRate: 0.5, outgoingCostRate: 0.5 }
      ]
    });

    expect(invalidInput.validation.isOutgoingShare100).toBe(false);
    expect(invalidInput.validation.isIncomingShare100).toBe(false);
    expect(invalidInput.validation.warnings.length).toBeGreaterThan(0);
  });
});
