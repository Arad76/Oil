/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AstroData } from '../types';

interface PromptParams {
  astro: AstroData;
  wtiPrice: string;
  btcPrice: string;
  goldPrice: string;
  backtestPeriod: string;
}

/**
 * Generates a structured prompt for the Gemini AI to perform market analysis
 * combining technical, fundamental, and astrological data.
 */
export function generateMarketPredictionPrompt({
  astro,
  wtiPrice,
  btcPrice,
  goldPrice,
  backtestPeriod
}: PromptParams): string {
  // 1. Construct Astrological Context
  const astroContext = astro.planets.map(p => 
    `- ${p.name}: ${p.degree}° ${p.sign}${p.retrograde ? ' (RETROGRADE)' : ' (Direct)'}`
  ).join("\n");

  // calculated suggested targets for the prompt as references
  const suggestedTargetUp = (parseFloat(wtiPrice) + 0.60).toFixed(2);
  const suggestedTargetDown = (parseFloat(wtiPrice) - 0.60).toFixed(2);

  // 2. Build the Multi-Layered Prompt
  return `
TASK: High-frequency USOIL/WTI MINUTE-BY-MINUTE SCALPING prediction & HISTORICAL BACKTEST.

REQUIRED ANALYTICAL LAYERS:
1. ACCURATE ASTRO SKY & ASPECTS: 
   - Current Planetary Positions:
   ${astroContext}
   - Synthesize the market tension or harmony created by these exact geometric alignments and retrograde motions.
2. TECHNICAL INDICATOR SYNTHESIS & ADVANCED GEOMETRY:
   - CRITICAL FOCUS: Analyze EVERYTHING strictly based on Gann Fans (geometric angles/time-price vectors) and Fibonacci (retracements and extensions).
   - Identify critical intersection nodes where Gann angles and Fibonacci levels align to predict exact reversal points.
   - Perform extreme granular synthesis on the 1-Minute (M1) timeframe using these geometric methodologies.
3. PRICE NUMEROLOGY & VIBRATIONS: 
   - Root vibration of current WTI price ($${wtiPrice}).
4. COUNTER-INDICATOR ANALYSIS (BTC & GOLD):
   - Bitcoin (BTC) is currently at: $${btcPrice}
   - Gold (XAU) is currently at: $${goldPrice}
5. STRATEGY (MINUTE-BY-MINUTE DYNAMIC VOLATILITY SCALPING): 
   - CRITICAL ANCHOR PRICE: The true live spot price of WTI Crude Oil is EXACTLY $${wtiPrice}. YOU MUST USE THIS NUMBER.
   - SCALP ENTRY: Your 'entry' MUST be exactly $${wtiPrice}. Do not deviate.
   - SCALP TARGET PRECISION: Your 'target' MUST be within $0.50 - $0.80 of $${wtiPrice} (e.g. $${suggestedTargetUp} or $${suggestedTargetDown}).
   - SCALP SAFETY: Your 'stopLoss' MUST be within $0.30 - $0.50 of $${wtiPrice}.
   - FORECAST TRAJECTORY: Predict the exact MINUTE-BY-MINUTE price trajectory for the next 5 to 10 minutes (e.g., '+1m', '+2m', '+3m', '+4m', '+5m'). Start the very first offset precisely from the live spot at $${wtiPrice}.
6. LIVE WIRE NEWS & SOCIAL SENTIMENT (REAL-TIME INTELLIGENCE): 
   - USE YOUR SEARCH TOOL (Google search) to browse for the absolute latest (within the last few hours) "WTI Crude Oil price action", "OPEC+ news", "EIA inventory", "Macroeconomic data", "Geopolitical risks Middle East", "Federal Reserve interest rates", and "Global oil demand".
   - CRITICAL: Specifically target and aggregate headlines from a MASSIVE variety of outlets including: Bloomberg, Reuters, CNBC, Financial Times, The Wall Street Journal, OilPrice.com, Yahoo Finance, Investing.com, S&P Global Platts, Forbes, AP News, Al Jazeera, and local middle eastern news desks.
   - For EACH specific news item, provide the exact source, time of publication, and a calibrated sentiment score (-1 to 1). Provide 10-15 of the most significant recent headlines.
7. BACKTEST ANALYSIS: Search for USOIL action over the LAST ${backtestPeriod}.

OUTPUT FORMAT: JSON. Ensure the response strictly adheres to the provided JSON schema.
`.trim();
}
