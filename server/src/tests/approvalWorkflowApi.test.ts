import { describe, it, expect, beforeAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import {
  getAllApprovedDecisions,
  getApprovedDecisionById,
  approveFinalScenario
} from '../services/approvalRepository';
import { updateFinalScenario, getFinalScenario } from '../services/finalScenarioRepository';

const prisma = new PrismaClient();

describe('Phase 3 - Approval Workflow Integration Tests', () => {
  beforeAll(async () => {
    // Clean approved decisions test table
    await prisma.approvedCarrierAllocation.deleteMany({});
    await prisma.approvedCommercialDecision.deleteMany({});
  });

  it('1. Fetches initial approval history without error', async () => {
    const history = await getAllApprovedDecisions();
    expect(Array.isArray(history)).toBe(true);
  });

  it('2. Approves active Final Scenario and persists decision record', async () => {
    // Setup active final scenario
    await updateFinalScenario({
      name: 'Q4 Strategic Allocation Final',
      outgoingMinutes: 120000,
      incomingMinutes: 240000,
      outgoingRevenueRate: 1.05,
      carriers: [
        { carrierName: 'Carrier Alpha', outgoingShare: 60, incomingShare: 50, incomingRevenueRate: 0.50, outgoingCostRate: 0.65 },
        { carrierName: 'Carrier Beta', outgoingShare: 40, incomingShare: 50, incomingRevenueRate: 0.40, outgoingCostRate: 0.55 }
      ]
    });

    const approved = await approveFinalScenario();
    expect(approved).toBeDefined();
    expect(approved.id).toBeDefined();
    expect(approved.status).toBe('Approved');
    expect(approved.scenarioName).toBe('Q4 Strategic Allocation Final');
    expect(approved.approvalTimestamp).toBeDefined();
    expect(approved.totals.totalRevenue).toBeGreaterThan(0);
    expect(approved.carrierAllocations.length).toBe(2);

    const alpha = approved.carrierAllocations.find(c => c.carrierName === 'Carrier Alpha');
    expect(alpha).toBeDefined();
    expect(alpha?.outgoingSharePct).toBe(60);
  });

  it('3. Retrieves approved decision details by ID from database', async () => {
    const history = await getAllApprovedDecisions();
    expect(history.length).toBeGreaterThan(0);

    const targetId = history[0].id;
    const fetched = await getApprovedDecisionById(targetId);

    expect(fetched).toBeDefined();
    expect(fetched?.id).toBe(targetId);
    expect(fetched?.status).toBe('Approved');
    expect(fetched?.carrierAllocations.length).toBeGreaterThan(0);
  });

  it('4. Confirms approval does NOT alter historical daily logs or active simulations', async () => {
    const historicalCount = await prisma.trafficCommercialRecord.count();
    const simCount = await prisma.commercialSimulation.count();

    // Execute another approval
    await approveFinalScenario({
      scenarioName: 'Audit Integrity Test Scenario',
      outgoingMinutes: 100000,
      incomingMinutes: 200000,
      outgoingRevenueRate: 1.0,
      carriers: [
        { carrierName: 'Carrier A', outgoingShare: 50, incomingShare: 50, incomingRevenueRate: 0.5, outgoingCostRate: 0.6 }
      ]
    });

    const postHistoricalCount = await prisma.trafficCommercialRecord.count();
    const postSimCount = await prisma.commercialSimulation.count();

    expect(postHistoricalCount).toBe(historicalCount);
    expect(postSimCount).toBe(simCount);
  });
});
