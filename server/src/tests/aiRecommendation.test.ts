import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getAiSimulationRecommendation } from '../services/aiRecommendationService';
import { MultiCarrierSimulationOutput } from '../calculation/types';

describe('AI Recommendation Feature Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  const mockSimulations: MultiCarrierSimulationOutput[] = [
    {
      id: 'sim-1',
      name: 'Simulation 1: Manager Baseline',
      outgoingMinutes: 100000,
      incomingMinutes: 200000,
      outgoingRevenueRate: 1.0,
      validation: {
        isValid: true,
        totalOutgoingSharePct: 100,
        totalIncomingSharePct: 100,
        isOutgoingShare100: true,
        isIncomingShare100: true,
        errors: [],
        warnings: []
      },
      carrierResults: [],
      totals: {
        totalIncomingTraffic: 200000,
        totalOutgoingTraffic: 100000,
        totalIncomingRevenue: 90000,
        totalSubscriberRevenue: 100000,
        totalRevenue: 190000,
        totalWholesaleCost: 66000,
        totalCost: 66000,
        netProfit: 124000,
        profitMarginPct: 65.26
      }
    },
    {
      id: 'sim-2',
      name: 'Simulation 2: High Yield Scenario',
      outgoingMinutes: 120000,
      incomingMinutes: 250000,
      outgoingRevenueRate: 1.1,
      validation: {
        isValid: true,
        totalOutgoingSharePct: 100,
        totalIncomingSharePct: 100,
        isOutgoingShare100: true,
        isIncomingShare100: true,
        errors: [],
        warnings: []
      },
      carrierResults: [],
      totals: {
        totalIncomingTraffic: 250000,
        totalOutgoingTraffic: 120000,
        totalIncomingRevenue: 120000,
        totalSubscriberRevenue: 132000,
        totalRevenue: 252000,
        totalWholesaleCost: 75000,
        totalCost: 75000,
        netProfit: 177000,
        profitMarginPct: 70.24
      }
    },
    {
      id: 'sim-3',
      name: 'Simulation 3: Low Cost Allocation',
      outgoingMinutes: 80000,
      incomingMinutes: 180000,
      outgoingRevenueRate: 0.9,
      validation: {
        isValid: true,
        totalOutgoingSharePct: 100,
        totalIncomingSharePct: 100,
        isOutgoingShare100: true,
        isIncomingShare100: true,
        errors: [],
        warnings: []
      },
      carrierResults: [],
      totals: {
        totalIncomingTraffic: 180000,
        totalOutgoingTraffic: 80000,
        totalIncomingRevenue: 75000,
        totalSubscriberRevenue: 72000,
        totalRevenue: 147000,
        totalWholesaleCost: 50000,
        totalCost: 50000,
        netProfit: 97000,
        profitMarginPct: 65.98
      }
    }
  ];

  it('1. Returns "AI recommendation unavailable" when AI_PROVIDER is not set', async () => {
    delete process.env.AI_PROVIDER;
    delete process.env.AI_API_KEY;

    const res = await getAiSimulationRecommendation(mockSimulations);
    expect(res.available).toBe(false);
    expect(res.message).toBe('AI recommendation unavailable');
  });

  it('2. Returns "AI recommendation unavailable" when API key is missing', async () => {
    process.env.AI_PROVIDER = 'openai';
    delete process.env.AI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    const res = await getAiSimulationRecommendation(mockSimulations);
    expect(res.available).toBe(false);
    expect(res.message).toBe('AI recommendation unavailable');
  });

  it('3. Successfully parses AI provider response when API is available', async () => {
    process.env.AI_PROVIDER = 'openai';
    process.env.AI_API_KEY = 'test-mock-key';

    const mockAiResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              suggestedSimulationId: 'sim-2',
              suggestedSimulationName: 'Simulation 2: High Yield Scenario',
              reason: 'Simulation 2 is suggested because it yields the highest Net Profit ($177,000) and top Profit Margin (70.24%) with strong Total Revenue ($252,000).'
            })
          }
        }
      ]
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockAiResponse
    } as any);

    const res = await getAiSimulationRecommendation(mockSimulations);
    expect(res.available).toBe(true);
    expect(res.suggestedSimulationId).toBe('sim-2');
    expect(res.suggestedSimulationName).toBe('Simulation 2: High Yield Scenario');
    expect(res.reason).toContain('Net Profit');
    expect(res.reason).toContain('Profit Margin');
  });

  it('4. Gracefully handles AI provider errors and returns unavailable', async () => {
    process.env.AI_PROVIDER = 'gemini';
    process.env.GEMINI_API_KEY = 'test-key';

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503
    } as any);

    const res = await getAiSimulationRecommendation(mockSimulations);
    expect(res.available).toBe(false);
    expect(res.message).toBe('AI recommendation unavailable');
  });
});
