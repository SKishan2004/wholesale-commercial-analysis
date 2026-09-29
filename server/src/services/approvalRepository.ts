import { prisma } from '../db/prismaClient';
import { calculateMultiCarrierSimulation } from '../calculation/calculationEngine';
import { getFinalScenario } from './finalScenarioRepository';

export interface ApprovedDecisionModel {
  id: string;
  scenarioId?: string | null;
  scenarioName: string;
  sourceSimulationName?: string | null;
  status: string;
  approvalTimestamp: Date;
  outgoingMinutes: number;
  incomingMinutes: number;
  outgoingRevenueRate: number;
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
  carrierAllocations: {
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
  }[];
  createdAt: Date;
}

/**
 * Fetch all past approved commercial decisions from database (sorted newest first)
 */
export const getAllApprovedDecisions = async (): Promise<ApprovedDecisionModel[]> => {
  const records = await prisma.approvedCommercialDecision.findMany({
    include: {
      carrierAllocations: true
    },
    orderBy: {
      approvalTimestamp: 'desc'
    }
  });

  return records.map(r => ({
    id: r.id,
    scenarioId: r.scenarioId,
    scenarioName: r.scenarioName,
    sourceSimulationName: r.sourceSimulationName,
    status: r.status,
    approvalTimestamp: r.approvalTimestamp,
    outgoingMinutes: r.outgoingMinutes,
    incomingMinutes: r.incomingMinutes,
    outgoingRevenueRate: r.outgoingRevenueRate,
    totals: {
      totalIncomingTraffic: r.totalIncomingTraffic,
      totalOutgoingTraffic: r.totalOutgoingTraffic,
      totalIncomingRevenue: r.totalIncomingRevenue,
      totalSubscriberRevenue: r.totalSubscriberRevenue,
      totalRevenue: r.totalRevenue,
      totalWholesaleCost: r.totalWholesaleCost,
      totalCost: r.totalWholesaleCost,
      netProfit: r.netProfit,
      profitMarginPct: r.profitMarginPct
    },
    carrierAllocations: r.carrierAllocations.map(c => ({
      id: c.id,
      carrierName: c.carrierName,
      outgoingSharePct: c.outgoingSharePct,
      incomingSharePct: c.incomingSharePct,
      incomingRevenueRate: c.incomingRevenueRate,
      outgoingCostRate: c.outgoingCostRate,
      calculatedOutgoingTraffic: c.calculatedOutgoingTraffic,
      calculatedIncomingTraffic: c.calculatedIncomingTraffic,
      incomingRevenue: c.incomingRevenue,
      subscriberRevenue: c.subscriberRevenue,
      totalRevenue: c.totalRevenue,
      wholesaleCost: c.wholesaleCost,
      netProfit: c.netProfit,
      profitMarginPct: c.profitMarginPct
    })),
    createdAt: r.createdAt
  }));
};

/**
 * Fetch a single approved decision by ID
 */
export const getApprovedDecisionById = async (id: string): Promise<ApprovedDecisionModel | null> => {
  const record = await prisma.approvedCommercialDecision.findUnique({
    where: { id },
    include: {
      carrierAllocations: true
    }
  });

  if (!record) return null;

  return {
    id: record.id,
    scenarioId: record.scenarioId,
    scenarioName: record.scenarioName,
    sourceSimulationName: record.sourceSimulationName,
    status: record.status,
    approvalTimestamp: record.approvalTimestamp,
    outgoingMinutes: record.outgoingMinutes,
    incomingMinutes: record.incomingMinutes,
    outgoingRevenueRate: record.outgoingRevenueRate,
    totals: {
      totalIncomingTraffic: record.totalIncomingTraffic,
      totalOutgoingTraffic: record.totalOutgoingTraffic,
      totalIncomingRevenue: record.totalIncomingRevenue,
      totalSubscriberRevenue: record.totalSubscriberRevenue,
      totalRevenue: record.totalRevenue,
      totalWholesaleCost: record.totalWholesaleCost,
      totalCost: record.totalWholesaleCost,
      netProfit: record.netProfit,
      profitMarginPct: record.profitMarginPct
    },
    carrierAllocations: record.carrierAllocations.map(c => ({
      id: c.id,
      carrierName: c.carrierName,
      outgoingSharePct: c.outgoingSharePct,
      incomingSharePct: c.incomingSharePct,
      incomingRevenueRate: c.incomingRevenueRate,
      outgoingCostRate: c.outgoingCostRate,
      calculatedOutgoingTraffic: c.calculatedOutgoingTraffic,
      calculatedIncomingTraffic: c.calculatedIncomingTraffic,
      incomingRevenue: c.incomingRevenue,
      subscriberRevenue: c.subscriberRevenue,
      totalRevenue: c.totalRevenue,
      wholesaleCost: c.wholesaleCost,
      netProfit: c.netProfit,
      profitMarginPct: c.profitMarginPct
    })),
    createdAt: record.createdAt
  };
};

/**
 * Approve a Final Scenario (persists approved allocation independently in database)
 */
export const approveFinalScenario = async (input?: {
  scenarioName?: string;
  outgoingMinutes?: number;
  incomingMinutes?: number;
  outgoingRevenueRate?: number;
  carriers?: any[];
}): Promise<ApprovedDecisionModel> => {
  // If no explicit payload passed, load current Final Scenario from database
  let targetInput = input;
  if (!targetInput || !targetInput.carriers || targetInput.carriers.length === 0) {
    const activeFinal = await getFinalScenario();
    targetInput = {
      scenarioName: activeFinal.name,
      outgoingMinutes: activeFinal.outgoingMinutes,
      incomingMinutes: activeFinal.incomingMinutes,
      outgoingRevenueRate: activeFinal.outgoingRevenueRate,
      carriers: activeFinal.carrierResults.map(c => ({
        carrierName: c.carrierName,
        outgoingShare: c.outgoingSharePct,
        incomingShare: c.incomingSharePct,
        incomingRevenueRate: c.incomingRevenueRate,
        outgoingCostRate: c.outgoingCostRate
      }))
    };
  }

  // Calculate official results
  const calculated = calculateMultiCarrierSimulation({
    outgoingMinutes: targetInput.outgoingMinutes || 100000,
    incomingMinutes: targetInput.incomingMinutes || 200000,
    outgoingRevenueRate: targetInput.outgoingRevenueRate || 1.0,
    carriers: targetInput.carriers || []
  });

  // Save to database table ApprovedCommercialDecision
  const created = await prisma.approvedCommercialDecision.create({
    data: {
      scenarioName: targetInput.scenarioName || 'Final Commercial Scenario',
      status: 'Approved',
      approvalTimestamp: new Date(),
      outgoingMinutes: calculated.outgoingMinutes,
      incomingMinutes: calculated.incomingMinutes,
      outgoingRevenueRate: calculated.outgoingRevenueRate,
      totalIncomingTraffic: calculated.totals.totalIncomingTraffic,
      totalOutgoingTraffic: calculated.totals.totalOutgoingTraffic,
      totalIncomingRevenue: calculated.totals.totalIncomingRevenue,
      totalSubscriberRevenue: calculated.totals.totalSubscriberRevenue,
      totalRevenue: calculated.totals.totalRevenue,
      totalWholesaleCost: calculated.totals.totalWholesaleCost,
      netProfit: calculated.totals.netProfit,
      profitMarginPct: calculated.totals.profitMarginPct,
      carrierAllocations: {
        create: calculated.carrierResults.map(c => ({
          carrierName: c.carrierName,
          outgoingSharePct: c.outgoingSharePct,
          incomingSharePct: c.incomingSharePct,
          incomingRevenueRate: c.incomingRevenueRate,
          outgoingCostRate: c.outgoingCostRate,
          calculatedOutgoingTraffic: c.calculatedOutgoingTraffic,
          calculatedIncomingTraffic: c.calculatedIncomingTraffic,
          incomingRevenue: c.incomingRevenue,
          subscriberRevenue: c.subscriberRevenue,
          totalRevenue: c.totalRevenue,
          wholesaleCost: c.wholesaleCost,
          netProfit: c.netProfit,
          profitMarginPct: c.profitMarginPct
        }))
      }
    },
    include: {
      carrierAllocations: true
    }
  });

  return getApprovedDecisionById(created.id) as Promise<ApprovedDecisionModel>;
};
