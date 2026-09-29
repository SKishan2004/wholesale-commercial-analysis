import { prisma } from '../db/prismaClient';
import { calculateMultiCarrierSimulation } from '../calculation/calculationEngine';
import { getAllSimulations } from './simulationRepository';
import {
  MultiCarrierSimulationInput,
  FinalScenarioOutput,
  ScenarioVarianceMetrics
} from '../calculation/types';

// Default Manager Baseline Seed for Final Scenario
const DEFAULT_FINAL_SCENARIO = {
  name: 'Final Commercial Scenario',
  description: 'Consolidated commercial allocation decision',
  outgoingMinutes: 100000,
  incomingMinutes: 200000,
  outgoingRevenueRate: 1.0,
  carriers: [
    { carrierName: 'Carrier A', outgoingShare: 60, incomingShare: 50, incomingRevenueRate: 0.50, outgoingCostRate: 0.70 },
    { carrierName: 'Carrier B', outgoingShare: 40, incomingShare: 50, incomingRevenueRate: 0.40, outgoingCostRate: 0.60 }
  ]
};

/**
 * Calculates variance deltas between Final Scenario and target simulation
 */
export function calculateScenarioVariance(
  finalSim: any,
  targetSim: any
): ScenarioVarianceMetrics {
  const fTotals = finalSim.totals;
  const tTotals = targetSim.totals;

  return {
    targetSimulationId: targetSim.id || '',
    targetSimulationName: targetSim.name || 'Simulation',
    revenueDiff: Number((fTotals.totalRevenue - tTotals.totalRevenue).toFixed(2)),
    costDiff: Number((fTotals.totalCost - tTotals.totalCost).toFixed(2)),
    netProfitDiff: Number((fTotals.netProfit - tTotals.netProfit).toFixed(2)),
    marginPctDiff: Number((fTotals.profitMarginPct - tTotals.profitMarginPct).toFixed(2)),
    incomingTrafficDiff: Math.round(fTotals.totalIncomingTraffic - tTotals.totalIncomingTraffic),
    outgoingTrafficDiff: Math.round(fTotals.totalOutgoingTraffic - tTotals.totalOutgoingTraffic)
  };
}

/**
 * Fetch the active Final Scenario from database. Auto-seeds if empty.
 */
export async function getFinalScenario(): Promise<FinalScenarioOutput> {
  let finalRec = await prisma.finalCommercialScenario.findFirst({
    include: {
      carriers: {
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  // Seed default if empty
  if (!finalRec) {
    finalRec = await prisma.finalCommercialScenario.create({
      data: {
        name: DEFAULT_FINAL_SCENARIO.name,
        description: DEFAULT_FINAL_SCENARIO.description,
        outgoingMinutes: DEFAULT_FINAL_SCENARIO.outgoingMinutes,
        incomingMinutes: DEFAULT_FINAL_SCENARIO.incomingMinutes,
        outgoingRevenueRate: DEFAULT_FINAL_SCENARIO.outgoingRevenueRate,
        carriers: {
          create: DEFAULT_FINAL_SCENARIO.carriers.map(c => ({
            carrierName: c.carrierName,
            outgoingShare: c.outgoingShare,
            incomingShare: c.incomingShare,
            incomingRevenueRate: c.incomingRevenueRate,
            outgoingCostRate: c.outgoingCostRate
          }))
        }
      },
      include: {
        carriers: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });
  }

  const finalInput: MultiCarrierSimulationInput = {
    id: finalRec.id,
    name: finalRec.name,
    description: finalRec.description || '',
    outgoingMinutes: finalRec.outgoingMinutes,
    incomingMinutes: finalRec.incomingMinutes,
    outgoingRevenueRate: finalRec.outgoingRevenueRate,
    carriers: finalRec.carriers.map(c => ({
      id: c.id,
      carrierName: c.carrierName,
      outgoingShare: c.outgoingShare,
      incomingShare: c.incomingShare,
      incomingRevenueRate: c.incomingRevenueRate,
      outgoingCostRate: c.outgoingCostRate
    }))
  };

  const finalOutput = calculateMultiCarrierSimulation(finalInput);

  // Fetch all active simulations to compute variance deltas
  const simulations = await getAllSimulations();
  const variances: ScenarioVarianceMetrics[] = simulations.map(sim =>
    calculateScenarioVariance(finalOutput, sim)
  );

  return {
    ...finalOutput,
    sourceSimulationId: finalRec.sourceSimulationId || undefined,
    variances
  };
}

/**
 * Update Final Scenario carrier allocations and traffic parameters
 */
export async function updateFinalScenario(
  data: MultiCarrierSimulationInput & { sourceSimulationId?: string }
): Promise<FinalScenarioOutput> {
  let finalRec = await prisma.finalCommercialScenario.findFirst();

  const finalId = finalRec ? finalRec.id : undefined;

  const updatedRec = await prisma.$transaction(async (tx) => {
    if (finalId) {
      await tx.finalScenarioCarrierInput.deleteMany({
        where: { finalScenarioId: finalId }
      });
    }

    const carriers = data.carriers || DEFAULT_FINAL_SCENARIO.carriers;

    if (finalId) {
      return await tx.finalCommercialScenario.update({
        where: { id: finalId },
        data: {
          name: data.name?.trim() || 'Final Commercial Scenario',
          description: data.description || 'Consolidated final carrier allocation decision',
          sourceSimulationId: data.sourceSimulationId || null,
          outgoingMinutes: Number(data.outgoingMinutes || 100000),
          incomingMinutes: Number(data.incomingMinutes || 200000),
          outgoingRevenueRate: Number(data.outgoingRevenueRate || 1.0),
          carriers: {
            create: carriers.map(c => ({
              carrierName: c.carrierName || 'Carrier',
              outgoingShare: Number(c.outgoingShare || 0),
              incomingShare: Number(c.incomingShare || 0),
              incomingRevenueRate: Number(c.incomingRevenueRate || 0),
              outgoingCostRate: Number(c.outgoingCostRate || 0)
            }))
          }
        },
        include: {
          carriers: {
            orderBy: { createdAt: 'asc' }
          }
        }
      });
    } else {
      return await tx.finalCommercialScenario.create({
        data: {
          name: data.name?.trim() || 'Final Commercial Scenario',
          description: data.description || 'Consolidated final carrier allocation decision',
          sourceSimulationId: data.sourceSimulationId || null,
          outgoingMinutes: Number(data.outgoingMinutes || 100000),
          incomingMinutes: Number(data.incomingMinutes || 200000),
          outgoingRevenueRate: Number(data.outgoingRevenueRate || 1.0),
          carriers: {
            create: carriers.map(c => ({
              carrierName: c.carrierName || 'Carrier',
              outgoingShare: Number(c.outgoingShare || 0),
              incomingShare: Number(c.incomingShare || 0),
              incomingRevenueRate: Number(c.incomingRevenueRate || 0),
              outgoingCostRate: Number(c.outgoingCostRate || 0)
            }))
          }
        },
        include: {
          carriers: {
            orderBy: { createdAt: 'asc' }
          }
        }
      });
    }
  });

  return await getFinalScenario();
}

/**
 * Copy simulation values into Final Scenario as an independent snapshot copy.
 * Does NOT create a live link.
 */
export async function copySimulationToFinalScenario(
  simulationId: string
): Promise<FinalScenarioOutput> {
  const sourceSim = await prisma.commercialSimulation.findUnique({
    where: { id: simulationId },
    include: { carriers: true }
  });

  if (!sourceSim) {
    throw new Error('Source simulation not found for copying.');
  }

  return await updateFinalScenario({
    name: `Final Scenario (Copied from ${sourceSim.name})`,
    description: `Independent final scenario snapshot copied from ${sourceSim.name}`,
    sourceSimulationId: simulationId,
    outgoingMinutes: sourceSim.outgoingMinutes,
    incomingMinutes: sourceSim.incomingMinutes,
    outgoingRevenueRate: sourceSim.outgoingRevenueRate,
    carriers: sourceSim.carriers.map(c => ({
      carrierName: c.carrierName,
      outgoingShare: c.outgoingShare,
      incomingShare: c.incomingShare,
      incomingRevenueRate: c.incomingRevenueRate,
      outgoingCostRate: c.outgoingCostRate
    }))
  });
}
