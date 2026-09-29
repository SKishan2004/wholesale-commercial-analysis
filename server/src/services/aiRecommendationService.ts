import { MultiCarrierSimulationOutput } from '../calculation/types';

export interface AiRecommendationResponse {
  available: boolean;
  suggestedSimulationId?: string;
  suggestedSimulationName?: string;
  reason?: string;
  message?: string;
  provider?: string;
}

/**
 * Calculates rule-based commercial recommendation as analytical fallback or default engine.
 * Compares Net Profit, Profit Margin, Total Revenue, and Total Cost.
 */
function calculateHeuristicRecommendation(
  simulations: MultiCarrierSimulationOutput[]
): AiRecommendationResponse {
  if (!simulations || simulations.length === 0) {
    return { available: false, message: 'AI recommendation unavailable' };
  }

  let maxNetProfit = -Infinity;
  let maxMargin = -Infinity;
  let bestSim = simulations[0];

  for (const sim of simulations) {
    const np = sim.totals?.netProfit ?? 0;
    const pm = sim.totals?.profitMarginPct ?? 0;

    // Evaluate best simulation prioritizing Net Profit and Profit Margin
    if (np > maxNetProfit || (Math.abs(np - maxNetProfit) < 0.01 && pm > maxMargin)) {
      maxNetProfit = np;
      maxMargin = pm;
      bestSim = sim;
    }
  }

  const totals = bestSim.totals || {
    totalRevenue: 0,
    totalWholesaleCost: 0,
    totalCost: 0,
    netProfit: 0,
    profitMarginPct: 0
  };
  const cost = totals.totalWholesaleCost || totals.totalCost || 0;

  const reason = `${bestSim.name} is suggested as the most suitable option because it achieves the highest Net Profit ($${totals.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}) and an optimal Profit Margin of ${totals.profitMarginPct.toFixed(2)}%, delivering Total Revenue of $${totals.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })} against Total Cost of $${cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}.`;

  return {
    available: true,
    suggestedSimulationId: bestSim.id,
    suggestedSimulationName: bestSim.name,
    reason,
    provider: 'heuristic'
  };
}

/**
 * Generates AI recommendation comparing simulations based on:
 * - Net Profit
 * - Profit Margin
 * - Total Revenue
 * - Total Cost
 *
 * Configurable AI provider via process.env:
 * - AI_PROVIDER: 'heuristic' (default) | 'openai' | 'gemini' | 'anthropic' | 'custom' | 'none'
 * - AI_API_KEY (or OPENAI_API_KEY, GEMINI_API_KEY, ANTHROPIC_API_KEY)
 * - AI_MODEL
 * - AI_API_ENDPOINT
 *
 * If AI is unconfigured/none or fails, returns { available: false, message: "AI recommendation unavailable" }
 */
export async function getAiSimulationRecommendation(
  simulations: MultiCarrierSimulationOutput[]
): Promise<AiRecommendationResponse> {
  if (!simulations || simulations.length === 0) {
    return {
      available: false,
      message: 'AI recommendation unavailable'
    };
  }

  const provider = (process.env.AI_PROVIDER || '').trim().toLowerCase();
  const apiKey =
    process.env.AI_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.ANTHROPIC_API_KEY ||
    '';

  const model = process.env.AI_MODEL || '';
  const endpoint = process.env.AI_API_ENDPOINT || '';

  // Explicitly unconfigured or disabled
  if (!provider || provider === 'none') {
    return {
      available: false,
      message: 'AI recommendation unavailable'
    };
  }

  // Built-in analytical commercial engine mode
  if (provider === 'heuristic') {
    return calculateHeuristicRecommendation(simulations);
  }

  // If external provider is requested but no API key provided
  if (!apiKey) {
    return {
      available: false,
      message: 'AI recommendation unavailable'
    };
  }

  // Format calculation comparison metrics for prompt
  const simSummaries = simulations
    .map((sim, index) => {
      const totals = sim.totals || {};
      return `Simulation ${index + 1}:
- ID: ${sim.id || `sim-${index + 1}`}
- Name: "${sim.name}"
- Net Profit: $${Number(totals.netProfit || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
- Profit Margin: ${Number(totals.profitMarginPct || 0).toFixed(2)}%
- Total Revenue: $${Number(totals.totalRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
- Total Cost (Wholesale): $${Number(totals.totalWholesaleCost || totals.totalCost || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
- Outgoing Traffic: ${Number(totals.totalOutgoingTraffic || 0).toLocaleString('en-US')} mins
- Incoming Traffic: ${Number(totals.totalIncomingTraffic || 0).toLocaleString('en-US')} mins`;
    })
    .join('\n\n');

  const systemPrompt = `You are a Senior Telecom Wholesale Commercial Analysis AI. 
Compare the calculated simulation results and select the SINGLE most suitable simulation.
Your evaluation MUST strictly consider:
1. Net Profit
2. Profit Margin (%)
3. Total Revenue
4. Total Cost

You MUST output JSON ONLY with the following exact structure:
{
  "suggestedSimulationId": "<ID of the chosen simulation>",
  "suggestedSimulationName": "<Name of the chosen simulation>",
  "reason": "<A concise 1-2 sentence explanation explaining why this simulation is suggested based on Net Profit, Profit Margin, Total Revenue, and Total Cost.>"
}`;

  const userPrompt = `Compare the following commercial simulations and suggest the best one:\n\n${simSummaries}`;

  try {
    let result: { suggestedSimulationId: string; suggestedSimulationName: string; reason: string };

    if (provider === 'openai' || provider === 'custom') {
      const url = endpoint || 'https://api.openai.com/v1/chat/completions';
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.2,
          response_format: { type: 'json_object' }
        })
      });

      if (!res.ok) {
        throw new Error(`AI provider responded with HTTP ${res.status}`);
      }

      const data: any = await res.json();
      const contentStr = data.choices?.[0]?.message?.content || '{}';
      result = JSON.parse(contentStr);
    } else if (provider === 'gemini') {
      const gModel = model || 'gemini-1.5-flash';
      const url =
        endpoint ||
        `https://generativelanguage.googleapis.com/v1beta/models/${gModel}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
          generationConfig: { responseMimeType: 'application/json' }
        })
      });

      if (!res.ok) {
        throw new Error(`Gemini provider responded with HTTP ${res.status}`);
      }

      const data: any = await res.json();
      const contentStr = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      result = JSON.parse(contentStr);
    } else if (provider === 'anthropic') {
      const url = endpoint || 'https://api.anthropic.com/v1/messages';
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: model || 'claude-3-haiku-20240307',
          max_tokens: 500,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }]
        })
      });

      if (!res.ok) {
        throw new Error(`Anthropic provider responded with HTTP ${res.status}`);
      }

      const data: any = await res.json();
      const contentStr = data.content?.[0]?.text || '{}';
      result = JSON.parse(contentStr);
    } else {
      return calculateHeuristicRecommendation(simulations);
    }

    // Match suggestion with actual simulation object
    const matchedSim =
      simulations.find(
        s => s.id === result.suggestedSimulationId || s.name === result.suggestedSimulationName
      ) || simulations[0];

    return {
      available: true,
      suggestedSimulationId: matchedSim.id || result.suggestedSimulationId,
      suggestedSimulationName: matchedSim.name || result.suggestedSimulationName,
      reason:
        result.reason ||
        `${matchedSim.name} provides the most balanced commercial outcome across Net Profit, Profit Margin, Total Revenue, and Total Cost.`,
      provider
    };
  } catch (err: any) {
    console.warn('⚠️ AI Recommendation request failed:', err.message || err);
    return {
      available: false,
      message: 'AI recommendation unavailable'
    };
  }
}
