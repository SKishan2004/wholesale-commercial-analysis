import { prisma } from '../db/prismaClient';
import { calculateMultiCarrierSimulation } from '../calculation/calculationEngine';
import {
  MultiCarrierSimulationInput,
  MultiCarrierSimulationOutput
} from '../calculation/types';

// Default Manager Baseline Seed Data
const DEFAULT_MANAGER_SIMULATION = {
  name: 'Simulation 1: Manager Allocation Baseline',
  description: 'Baseline carrier allocation (Carrier A 60% / Carrier B 40%)',
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

/**
 * Fetch all simulations from database.
 * Auto-seeds initial baseline simulation if database has zero simulations.
 */
export async function getAllSimulations(): Promise<MultiCarrierSimulationOutput[]> {
  let dbSimulations = await prisma.commercialSimulation.findMany({
    include: {
      carriers: {
        orderBy: { createdAt: 'asc' }
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  // Seed default simulation if empty
  if (dbSimulations.length === 0) {
    const created = await createSimulation(DEFAULT_MANAGER_SIMULATION);
    return [created];
  }

  return dbSimulations.map(sim => {
    const input: MultiCarrierSimulationInput = {
      id: sim.id,
      name: sim.name,
      description: sim.description || '',
      outgoingMinutes: sim.outgoingMinutes,
      incomingMinutes: sim.incomingMinutes,
      outgoingRevenueRate: sim.outgoingRevenueRate,
      carriers: sim.carriers.map(c => ({
        id: c.id,
        carrierName: c.carrierName,
        outgoingShare: c.outgoingShare,
        incomingShare: c.incomingShare,
        incomingRevenueRate: c.incomingRevenueRate,
        outgoingCostRate: c.outgoingCostRate
      }))
    };
    return calculateMultiCarrierSimulation(input);
  });
}

/**
 * Get a single simulation by ID
 */
export async function getSimulationById(id: string): Promise<MultiCarrierSimulationOutput | null> {
  const sim = await prisma.commercialSimulation.findUnique({
    where: { id },
    include: {
      carriers: {
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  if (!sim) return null;

  const input: MultiCarrierSimulationInput = {
    id: sim.id,
    name: sim.name,
    description: sim.description || '',
    outgoingMinutes: sim.outgoingMinutes,
    incomingMinutes: sim.incomingMinutes,
    outgoingRevenueRate: sim.outgoingRevenueRate,
    carriers: sim.carriers.map(c => ({
      id: c.id,
      carrierName: c.carrierName,
      outgoingShare: c.outgoingShare,
      incomingShare: c.incomingShare,
      incomingRevenueRate: c.incomingRevenueRate,
      outgoingCostRate: c.outgoingCostRate
    }))
  };

  return calculateMultiCarrierSimulation(input);
}

/**
 * Create a new commercial simulation (Max 3 simulations allowed in Phase 1)
 */
export async function createSimulation(
  data: MultiCarrierSimulationInput
): Promise<MultiCarrierSimulationOutput> {
  const count = await prisma.commercialSimulation.count();
  if (count >= 3) {
    throw new Error('Maximum 3 commercial simulations allowed in this workspace phase.');
  }

  const simName = data.name?.trim() || `Simulation ${count + 1}`;
  const description = data.description || '';
  const outgoingMinutes = Number(data.outgoingMinutes || 100000);
  const incomingMinutes = Number(data.incomingMinutes || 200000);
  const outgoingRevenueRate = Number(data.outgoingRevenueRate || 1.0);

  const carriers = data.carriers && data.carriers.length > 0
    ? data.carriers
    : DEFAULT_MANAGER_SIMULATION.carriers;

  const newSim = await prisma.commercialSimulation.create({
    data: {
      name: simName,
      description,
      outgoingMinutes,
      incomingMinutes,
      outgoingRevenueRate,
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

  const input: MultiCarrierSimulationInput = {
    id: newSim.id,
    name: newSim.name,
    description: newSim.description || '',
    outgoingMinutes: newSim.outgoingMinutes,
    incomingMinutes: newSim.incomingMinutes,
    outgoingRevenueRate: newSim.outgoingRevenueRate,
    carriers: newSim.carriers.map(c => ({
      id: c.id,
      carrierName: c.carrierName,
      outgoingShare: c.outgoingShare,
      incomingShare: c.incomingShare,
      incomingRevenueRate: c.incomingRevenueRate,
      outgoingCostRate: c.outgoingCostRate
    }))
  };

  return calculateMultiCarrierSimulation(input);
}

/**
 * Update an existing simulation and its carrier inputs
 */
export async function updateSimulation(
  id: string,
  data: MultiCarrierSimulationInput
): Promise<MultiCarrierSimulationOutput> {
  const existing = await prisma.commercialSimulation.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Simulation not found.');
  }

  const updatedSim = await prisma.$transaction(async (tx) => {
    // Delete existing carriers for this simulation
    await tx.simulationCarrierInput.deleteMany({
      where: { simulationId: id }
    });

    const carriers = data.carriers || [];

    // Update parent simulation record and recreate carrier records
    return await tx.commercialSimulation.update({
      where: { id },
      data: {
        name: data.name?.trim() || existing.name,
        description: data.description !== undefined ? data.description : existing.description,
        outgoingMinutes: Number(data.outgoingMinutes ?? existing.outgoingMinutes),
        incomingMinutes: Number(data.incomingMinutes ?? existing.incomingMinutes),
        outgoingRevenueRate: Number(data.outgoingRevenueRate ?? existing.outgoingRevenueRate),
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
  });

  const input: MultiCarrierSimulationInput = {
    id: updatedSim.id,
    name: updatedSim.name,
    description: updatedSim.description || '',
    outgoingMinutes: updatedSim.outgoingMinutes,
    incomingMinutes: updatedSim.incomingMinutes,
    outgoingRevenueRate: updatedSim.outgoingRevenueRate,
    carriers: updatedSim.carriers.map(c => ({
      id: c.id,
      carrierName: c.carrierName,
      outgoingShare: c.outgoingShare,
      incomingShare: c.incomingShare,
      incomingRevenueRate: c.incomingRevenueRate,
      outgoingCostRate: c.outgoingCostRate
    }))
  };

  return calculateMultiCarrierSimulation(input);
}

/**
 * Duplicate an existing simulation into a new independent simulation slot
 */
export async function duplicateSimulation(id: string): Promise<MultiCarrierSimulationOutput> {
  const count = await prisma.commercialSimulation.count();
  if (count >= 3) {
    throw new Error('Maximum 3 commercial simulations allowed in this workspace phase.');
  }

  const existing = await prisma.commercialSimulation.findUnique({
    where: { id },
    include: { carriers: true }
  });

  if (!existing) {
    throw new Error('Simulation not found for duplication.');
  }

  return await createSimulation({
    name: `${existing.name} (Copy)`,
    description: existing.description || '',
    outgoingMinutes: existing.outgoingMinutes,
    incomingMinutes: existing.incomingMinutes,
    outgoingRevenueRate: existing.outgoingRevenueRate,
    carriers: existing.carriers.map(c => ({
      carrierName: c.carrierName,
      outgoingShare: c.outgoingShare,
      incomingShare: c.incomingShare,
      incomingRevenueRate: c.incomingRevenueRate,
      outgoingCostRate: c.outgoingCostRate
    }))
  });
}

/**
 * Delete a simulation by ID
 */
export async function deleteSimulation(id: string): Promise<void> {
  const count = await prisma.commercialSimulation.count();
  if (count <= 1) {
    throw new Error('At least one commercial simulation must remain in the workspace.');
  }
  await prisma.commercialSimulation.delete({ where: { id } });
}
