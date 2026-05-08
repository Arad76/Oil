/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { io, Socket } from "socket.io-client";
import { PredictionResult, AstroData, NumerologyData } from '../types';
import { Terminal, TrendingUp, TrendingDown, RefreshCcw, ShieldAlert, Newspaper, Activity, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { PredictionChart } from './PredictionChart';
import { generateMarketPredictionPrompt } from '../lib/promptUtils';

// Enhanced types
interface NewsHeadline {
  title: string;
  source: string;
  time: string;
  sentiment: number; // -1 to 1
}

interface SourceSentiment {
  name: string;
  score: number;
}

interface BacktestMetrics {
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
  sampleSize: number;
}

interface SentimentData {
  score: number; // -1 to 1
  label: string;
  keyHeadlines: NewsHeadline[];
  sourceAggregate: SourceSentiment[];
}

interface QuantumCorrelation {
  priceVibration: number;
  timeVibration: number;
  alignment: string;
  timestamp?: string;
  confidenceScore?: 'High' | 'Medium' | 'Low';
  impactHours?: number;
}

interface EnhancedPredictionResult extends PredictionResult {
  sentiment?: SentimentData;
  quantumCorrelation?: QuantumCorrelation;
  backtest?: BacktestMetrics;
  forecastTrajectory?: { timeOffset: string; expectedPrice: number }[];
}

// Use lazy initialization for AI client
let aiInstance: GoogleGenAI | null = null;
const getAI = () => {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("GEMINI_API_KEY is missing. AI predictions will be disabled.");
    }
    aiInstance = new GoogleGenAI({ apiKey: key || 'NO_KEY' });
  }
  return aiInstance;
};

interface Props {
  astro: AstroData;
  numerology: NumerologyData;
}

export function PredictionTerminal({ astro, numerology }: Props) {
  const [prediction, setPrediction] = useState<EnhancedPredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [backtestPeriod, setBacktestPeriod] = useState("72h");
  const [liveVibrations, setLiveVibrations] = useState<QuantumCorrelation | null>(null);
  const [vibrationHistory, setVibrationHistory] = useState<{ time: string, priceVibration: number, timeVibration: number }[]>([]);
  const [liveNews, setLiveNews] = useState<NewsHeadline[]>([]);

  // WebSocket Integration for Real-time Quantum Signals
  useEffect(() => {
    // Determine socket URL based on environment
    const socketUrl = window.location.origin;
    const socket: Socket = io(socketUrl);

    // Initial fetch for news
    fetch('/api/news')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setLiveNews(data);
      })
      .catch(err => console.error("Initial news sync failed", err));

    socket.on("quantum-signal", (data: QuantumCorrelation & { timestamp: string }) => {
      setLiveVibrations({
        priceVibration: data.priceVibration,
        timeVibration: data.timeVibration,
        alignment: data.alignment,
        confidenceScore: data.confidenceScore,
        impactHours: data.impactHours,
        timestamp: data.timestamp || new Date().toISOString()
      });
      setVibrationHistory(prev => {
        const timeStr = new Date(data.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const newer = [...prev, { time: timeStr, priceVibration: data.priceVibration, timeVibration: data.timeVibration }];
        return newer.slice(-20); // keep last 20 ticks
      });
    });

    socket.on("market-sync", (data: any) => {
      // Logic for real-time market sync can be added here
      // For example, triggering a lightweight prediction refresh or updating a mini-ticker
      console.log("Market Matrix Sync:", data.timestamp);
    });

    socket.on("news-update", (data: NewsHeadline[]) => {
      if (Array.isArray(data)) setLiveNews(data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  async function generatePrediction(periodOverride?: string) {
    const period = periodOverride || backtestPeriod;
    setLoading(true);
    setError(null);
    try {
      const ai = getAI();
      
      // Fetch the true spot price to anchor the LLM
      let livePriceStr = "87.00";
      let btcPriceStr = "UNKNOWN";
      let goldPriceStr = "UNKNOWN";
      
      // Helper for robust price fetching with cross-source fallbacks
      const fetchWithFallback = async (symbol: string, type: 'WTI' | 'BTC' | 'GOLD'): Promise<string | null> => {
        // Source 1: Primary API (Node Backend)
        try {
          const res = await fetch(`/api/quote?symbol=${symbol}`);
          const data = await res.json();
          if (data && data.price) return parseFloat(data.price).toFixed(2);
        } catch (e) {
          console.warn(`Primary Source Alpha [${type}] unreachable.`);
        }

        // Source 2: Secondary Public Mirrors / Direct Integrations
        try {
          if (type === 'BTC') {
            const res = await fetch('https://api.coindesk.com/v1/bpi/currentprice/BTC.json');
            const data = await res.json();
            return data.bpi.USD.rate_float.toFixed(2);
          }
          
          if (type === 'WTI' || type === 'GOLD') {
            // Attempting source Beta via secondary server-side backup (if available) or mirror
            const res = await fetch(`https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`);
            const data = await res.json();
            const price = data.chart.result[0].meta.regularMarketPrice;
            if (price) return price.toFixed(2);
          }
        } catch (e) {
          console.error(`Secondary Source Beta [${type}] failed.`);
        }

        return null;
      };

      try {
        const [wtiPrice, btcPrice, goldPrice] = await Promise.all([
          fetchWithFallback('CL=F', 'WTI'),
          fetchWithFallback('BTC-USD', 'BTC'),
          fetchWithFallback('GC=F', 'GOLD')
        ]);
        
        if (wtiPrice) livePriceStr = wtiPrice;
        if (btcPrice) btcPriceStr = btcPrice;
        if (goldPrice) goldPriceStr = goldPrice;
      } catch (err) {
        console.warn("Complete price matrix failure. Resorting to static baseline.");
      }

      const prompt = generateMarketPredictionPrompt({
        astro,
        wtiPrice: livePriceStr,
        btcPrice: btcPriceStr,
        goldPrice: goldPriceStr,
        backtestPeriod: period
      });

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        tools: [{ googleSearch: {} }],
        toolConfig: { includeServerSideToolInvocations: true },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              confidence: { type: Type.NUMBER },
              direction: { type: Type.STRING, enum: ["UP", "DOWN", "NEUTRAL"] },
              reasoning: { type: Type.STRING },
              sentiment: {
                type: Type.OBJECT,
                properties: {
                  score: { type: Type.NUMBER, description: "Overall sentiment score from -1 (bearish) to 1 (bullish)" },
                  label: { type: Type.STRING },
                  keyHeadlines: { 
                    type: Type.ARRAY, 
                    items: { 
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        source: { type: Type.STRING },
                        time: { type: Type.STRING, description: "Relative time e.g. 5m ago" },
                        sentiment: { type: Type.NUMBER, description: "-1 to 1" }
                      },
                      required: ["title", "source", "time", "sentiment"]
                    } 
                  },
                  sourceAggregate: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        score: { type: Type.NUMBER }
                      },
                      required: ["name", "score"]
                    }
                  }
                },
                required: ["score", "label", "keyHeadlines", "sourceAggregate"]
              },
              quantumCorrelation: {
                type: Type.OBJECT,
                properties: {
                  priceVibration: { type: Type.NUMBER },
                  timeVibration: { type: Type.NUMBER },
                  alignment: { type: Type.STRING },
                  confidenceScore: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
                  impactHours: { type: Type.NUMBER }
                },
                required: ["priceVibration", "timeVibration", "alignment", "confidenceScore", "impactHours"]
              },
              backtest: {
                type: Type.OBJECT,
                properties: {
                  winRate: { type: Type.NUMBER },
                  profitFactor: { type: Type.NUMBER },
                  maxDrawdown: { type: Type.NUMBER },
                  sampleSize: { type: Type.NUMBER }
                },
                required: ["winRate", "profitFactor", "maxDrawdown", "sampleSize"]
              },
              strategy: {
                type: Type.OBJECT,
                properties: {
                  leverage: { type: Type.STRING },
                  entry: { type: Type.STRING },
                  target: { type: Type.STRING },
                  stopLoss: { type: Type.STRING }
                },
                required: ["leverage", "entry", "target", "stopLoss"]
              },
              forecastTrajectory: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    timeOffset: { type: Type.STRING, description: "e.g., '+15m', '+30m'" },
                    expectedPrice: { type: Type.NUMBER }
                  },
                  required: ["timeOffset", "expectedPrice"]
                }
              }
            },
            required: ["confidence", "direction", "reasoning", "sentiment", "strategy", "forecastTrajectory"]
          }
        }
      } as any);

      const data = JSON.parse(response.text || '{}') as EnhancedPredictionResult;
      const enh = { ...data, timestamp: new Date().toISOString() };
      setPrediction(enh);
      setLastUpdate(new Date());
      
      if (enh.quantumCorrelation) {
        setVibrationHistory(prev => {
          const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const newer = [...prev, { time: timeStr, priceVibration: enh.quantumCorrelation!.priceVibration, timeVibration: enh.quantumCorrelation!.timeVibration }];
          return newer.slice(-20);
        });
      }
    } catch (err) {
      console.error(err);
      if (err instanceof Error && err.message.includes('API key')) {
        setError("Sync Error: GEMINI_API_KEY is missing or invalid. Please configure it in the Settings menu.");
      } else {
        setError("Sync Error: Quantum interference in news feed. Check connectivity.");
      }
    } finally {
      setLoading(false);
    }
  }

  // Auto-refresh prediction every 1 minute
  useEffect(() => {
    generatePrediction();
    const interval = setInterval(generatePrediction, 60000);
    return () => clearInterval(interval);
  }, []);

  const sentimentScore = prediction?.sentiment?.score || 0;
  const themeClass = sentimentScore > 0.2 
    ? "border-green-500/30 shadow-[inset_0_0_20px_rgba(34,197,94,0.05)]" 
    : sentimentScore < -0.2 
      ? "border-red-500/30 shadow-[inset_0_0_20px_rgba(239,68,68,0.05)]" 
      : "border-oil-gold/30";

  return (
    <div className={`flex flex-col h-full bg-oil-black border ${themeClass} rounded-lg overflow-hidden relative transition-colors duration-1000`}>
      <div className="terminal-scanline" />
      
      {/* Header */}
      <div className="bg-oil-dim border-b border-oil-border p-3 flex justify-between items-center">
        <div className="flex items-center gap-2 text-oil-gold">
          <Terminal size={16} />
          <span className="font-mono text-xs uppercase tracking-widest">Prediction Terminal v4.0</span>
        </div>
        <button 
          onClick={() => generatePrediction()}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-all disabled:opacity-50 group"
        >
          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-tighter">
            {loading ? 'Scanning...' : `Scan: ${backtestPeriod.toUpperCase()}`}
          </span>
          <RefreshCcw size={12} className={`text-oil-gold ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
        </button>
      </div>

      {/* Main Display */}
      <div className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-4">
        {loading && (
          <div className="flex items-center gap-2 text-oil-amber/70">
            <RefreshCcw size={12} className="animate-spin" />
            <span>Scanning news wires & astral planes...</span>
          </div>
        )}

        {error && (
          <div className="text-red-500 flex items-center gap-2 italic">
            <ShieldAlert size={14} />
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {prediction ? (
            <motion.div 
              key={prediction.timestamp}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4 pb-4"
            >
              {/* Market Direction */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className={`text-xl font-black px-4 py-1.5 rounded skew-x-[-12deg] ${prediction.direction === 'UP' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : prediction.direction === 'DOWN' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'}`}>
                    {prediction.direction === 'UP' ? 'VEC: CALL' : prediction.direction === 'DOWN' ? 'VEC: PUT' : 'VEC: SIDE'}
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] text-gray-500">CONFIDENCE</div>
                    <div className="text-oil-gold font-bold">{(prediction.confidence! * 100).toFixed(1)}%</div>
                  </div>
                </div>

                <div className="p-3 bg-oil-gold/5 border-l-2 border-oil-gold text-gray-300 italic text-[11px] leading-relaxed">
                  "{prediction.reasoning}"
                </div>
              </div>

              {/* Sentiment Gauge */}
              {prediction.sentiment && (
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-oil-gold uppercase text-[9px] font-black tracking-widest">
                      <Newspaper size={12} />
                      Quantum Market Sentiment
                    </div>
                    <div className={`text-[10px] font-black px-2 py-0.5 rounded italic tracking-widest ${prediction.sentiment.score > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {prediction.sentiment.score > 0 ? 'BULLISH' : 'BEARISH'}
                    </div>
                  </div>
                  
                  <div className="relative h-20 flex items-center justify-center overflow-hidden">
                    {/* Semi-circular Gauge Background */}
                    <svg viewBox="0 0 100 50" className="w-48 h-24">
                      <path 
                        d="M 10 45 A 35 35 0 0 1 90 45" 
                        fill="none" 
                        stroke="rgba(255,255,255,0.05)" 
                        strokeWidth="8" 
                        strokeLinecap="round"
                      />
                      <path 
                        d="M 10 45 A 35 35 0 0 1 50 10" 
                        fill="none" 
                        stroke="rgba(239,68,68,0.2)" 
                        strokeWidth="8" 
                        strokeLinecap="round"
                      />
                      <path 
                        d="M 50 10 A 35 35 0 0 1 90 45" 
                        fill="none" 
                        stroke="rgba(34,197,94,0.2)" 
                        strokeWidth="8" 
                        strokeLinecap="round"
                      />
                      
                      {/* Dynamic Needle */}
                      <motion.g
                        initial={{ rotate: -90 }}
                        animate={{ rotate: prediction.sentiment.score * 90 }}
                        transition={{ type: "spring", stiffness: 40, damping: 10 }}
                        style={{ originX: "50px", originY: "45px" }}
                      >
                        <line x1="50" y1="45" x2="50" y2="15" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" />
                        <circle cx="50" cy="45" r="3" fill="#D4AF37" />
                      </motion.g>
                    </svg>
                    
                    <div className="absolute bottom-2 flex flex-col items-center">
                      <span className="text-[10px] text-gray-500 font-bold">SENTIMENT SCORE</span>
                      <span className="text-xl font-black text-white">{(prediction.sentiment.score * 100).toFixed(0)}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-[8px] font-mono text-gray-500 px-4 -mt-2">
                    <span className="text-red-500/50">BEAR VORTEX</span>
                    <span className="text-green-500/50">BULL ORBIT</span>
                  </div>

                  {/* Entry Zone Visualization */}
                  <div className="mt-4 p-2 bg-oil-gold/5 border border-oil-gold/20 rounded flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[8px] text-oil-gold uppercase font-black">Quantum Entry Zone</span>
                      <span className="text-xs font-mono font-bold text-white">
                        {prediction.strategy.entry}
                      </span>
                    </div>
                    <div className="px-2 py-1 bg-oil-amber/20 rounded border border-oil-amber/30 text-[9px] text-oil-amber font-black animate-pulse">
                      ACTIVE SCALP
                    </div>
                  </div>
                </div>
              )}

              {/* Dedicated Live Quantum Wire Feed */}
              {(liveNews.length > 0 || (prediction.sentiment && prediction.sentiment.keyHeadlines.length > 0)) && (
                <>
                  <div className="flex flex-col bg-black/40 border border-white/5 rounded-lg overflow-hidden h-[320px] shadow-2xl relative" id="quantum-wire-feed">
                  <div className="bg-white/[0.03] border-b border-white/5 px-3 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <div className="relative">
                         <Newspaper size={14} className="text-oil-gold" />
                         <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                       </div>
                       <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/90">Live Quantum Wire</span>
                    </div>
                    <div className="flex gap-2">
                       <div className="px-1.5 py-0.5 rounded bg-oil-gold/10 border border-oil-gold/20 text-[7px] text-oil-gold font-bold uppercase tracking-tighter">
                         Satellite Sync: Active
                       </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar scroll-smooth" id="scrollable-news-feed">
                    {(liveNews.length > 0 ? liveNews : prediction.sentiment!.keyHeadlines).map((h, i) => (
                      <motion.div 
                        key={`${h.title}-${i}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="group relative p-3 bg-white/[0.02] border border-white/5 hover:border-oil-gold/40 hover:bg-white/[0.04] transition-all duration-300 rounded-md overflow-hidden"
                      >
                        {/* Sentiment Edge Glow */}
                        <div className={`absolute left-0 top-0 bottom-0 w-[2px] ${
                          h.sentiment > 0.3 ? 'bg-green-500' : 
                          h.sentiment < -0.3 ? 'bg-red-500' : 
                          'bg-oil-gold/30'
                        }`} />

                        <div className="flex justify-between items-start gap-3 mb-2">
                          <h4 className="text-[11px] leading-snug font-medium text-gray-200 group-hover:text-white transition-colors">
                            {h.title}
                          </h4>
                          <div className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-black tracking-tighter border ${
                            h.sentiment > 0.15 ? 'bg-green-500/10 text-green-400 border-green-500/30' : 
                            h.sentiment < -0.15 ? 'bg-red-500/10 text-red-400 border-red-500/30' : 
                            'bg-white/5 text-gray-400 border-white/10'
                          }`}>
                            {h.sentiment > 0 ? '+' : ''}{h.sentiment.toFixed(2)}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-white/5 flex items-center justify-center border border-white/10 text-[8px] font-black text-oil-gold uppercase">
                              {h.source.charAt(0)}
                            </div>
                            <span className="text-[9px] font-black text-oil-amber/80 uppercase tracking-widest">{h.source}</span>
                          </div>
                          <span className="text-[8px] font-mono text-gray-600 font-bold">[{h.time}]</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="p-2 border-t border-white/5 bg-black/60 flex items-center justify-between text-[7px] text-gray-500 uppercase tracking-widest font-black">
                     <span>Buffer state: Optimal</span>
                     <span className="animate-pulse">Tracking {(liveNews.length > 0 ? liveNews : prediction.sentiment!.keyHeadlines).length} Signals</span>
                  </div>
                </div>

                {/* Source Sentiment Breakdown */}
                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg space-y-3 mt-4">
                  <div className="flex items-center justify-between px-1">
                    <div className="text-[8px] text-gray-500 uppercase font-black tracking-widest">Sentiment Source Contribution</div>
                    <div className="flex gap-2 text-[7px] text-gray-600 font-bold uppercase tracking-tighter">
                      <span className="text-red-500/80">Negative</span>
                      <span className="opacity-10">|</span>
                      <span className="text-green-500/80">Positive</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 px-1">
                    {prediction.sentiment.sourceAggregate.map((source, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-16 shrink-0 text-[8px] font-mono text-gray-400 uppercase truncate" title={source.name}>
                          {source.name}
                        </div>
                        <div className="flex-1 h-3 bg-black/40 border border-white/5 rounded-sm overflow-hidden flex relative">
                          {/* Zero line */}
                          <div className="absolute left-1/2 top-0 w-[1px] h-full bg-white/10 z-10" />
                          
                          {/* Negative bar */}
                          <div className="flex-1 flex justify-end">
                            {source.score < 0 && (
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(Math.abs(source.score) * 100, 100)}%` }}
                                className="h-full bg-red-500/40 border-r border-red-500/60"
                              />
                            )}
                          </div>
                          
                          {/* Positive bar */}
                          <div className="flex-1 flex justify-start">
                            {source.score > 0 && (
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(Math.abs(source.score) * 100, 100)}%` }}
                                className="h-full bg-green-500/40 border-l border-green-500/60"
                              />
                            )}
                          </div>
                        </div>
                        <div className={`w-8 shrink-0 text-[9px] font-black text-right font-mono ${source.score > 0 ? 'text-green-500' : source.score < 0 ? 'text-red-500' : 'text-gray-600'}`}>
                          {source.score > 0 ? '+' : ''}{source.score.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

              {/* Quantum Numerical Matrix - Asset & Astral Inputs */}
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-oil-gold">
                    <Activity size={12} />
                    Quantum Input Matrix
                  </div>
                  <div className="text-[7px] text-gray-600 font-mono italic">DATA_LAYER_SYNC</div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 pb-2 border-b border-white/5">
                  <div className="flex flex-col p-2 bg-oil-gold/10 rounded border border-oil-gold/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-8 h-8 bg-oil-gold/10 -rotate-45 translate-x-4 -translate-y-4" />
                    <span className="text-[8px] text-oil-gold uppercase font-bold mb-1">Asset Price Vib.</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black text-white">
                        {liveVibrations?.priceVibration || prediction?.quantumCorrelation?.priceVibration || '—'}
                      </span>
                      <span className="text-[8px] text-oil-gold/60 underline decoration-dotted uppercase">
                        {liveVibrations ? 'WIRE_PUSH' : 'SCAN_STATE'}
                      </span>
                    </div>
                    {(liveVibrations?.timestamp || prediction?.timestamp) && (
                      <div className="text-[7px] text-oil-gold/50 font-mono mt-1 tracking-tighter">
                        TS: {new Date((liveVibrations?.timestamp || prediction?.timestamp) as string).toISOString().replace('T', ' ').replace('Z', '')}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col p-2 bg-white/5 rounded border border-white/10">
                    <span className="text-[8px] text-gray-500 uppercase font-bold mb-1">Cosmic Time Vib.</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black text-white">
                        {liveVibrations?.timeVibration || prediction?.quantumCorrelation?.timeVibration || '—'}
                      </span>
                      <span className="text-[8px] text-gray-600/60 underline decoration-dotted uppercase">
                         {liveVibrations ? 'UTC_SYNC' : 'STATIC'}
                      </span>
                    </div>
                    {(liveVibrations?.timestamp || prediction?.timestamp) && (
                      <div className="text-[7px] text-gray-500/50 font-mono mt-1 tracking-tighter">
                        TS: {new Date((liveVibrations?.timestamp || prediction?.timestamp) as string).toISOString().replace('T', ' ').replace('Z', '')}
                      </div>
                    )}
                  </div>
                </div>

                {vibrationHistory.length > 0 && (
                  <div className="h-40 my-3 pb-2 border-b border-white/5">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={vibrationHistory} margin={{ top: 5, right: -5, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis dataKey="time" stroke="#ffffff30" fontSize={7} tickMargin={5} />
                        <YAxis yAxisId="left" stroke="#d4af37" fontSize={7} orientation="left" />
                        <YAxis yAxisId="right" stroke="#93c5fd" fontSize={7} orientation="right" />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#000000ee', border: '1px solid #ffffff20', fontSize: '10px' }}
                          labelStyle={{ color: '#d4af37', marginBottom: '4px' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '8px' }} />
                        <Line yAxisId="left" type="monotone" dataKey="priceVibration" name="Price Vib." stroke="#d4af37" strokeWidth={1.5} dot={{ r: 1.5, fill: '#d4af37' }} isAnimationActive={true} />
                        <Line yAxisId="right" type="monotone" dataKey="timeVibration" name="Time Vib." stroke="#93c5fd" strokeWidth={1.5} dot={{ r: 1.5, fill: '#93c5fd' }} isAnimationActive={true} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="text-[8px] text-gray-500 uppercase font-bold tracking-widest px-1">Planetary Degree Vibrations</div>
                  <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                    {astro.planets.map((p, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-black/40 rounded border border-white/5 hover:border-oil-gold/20 transition-all cursor-default">
                        <div className="flex flex-col">
                          <span className="text-[7px] text-gray-500 font-bold uppercase">{p.name}</span>
                          <span className="text-[9px] text-white font-mono leading-none mt-0.5">{p.degree}° {p.sign.substring(0,3)}</span>
                        </div>
                        <div className="flex flex-col items-center">
                           <span className="text-[7px] text-oil-gold/40 font-mono mb-0.5">VIBE</span>
                           <span className="text-[11px] font-black text-oil-gold leading-none">{p.numerology}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {(liveVibrations || prediction?.quantumCorrelation) && (
                  <div className="flex flex-col gap-1.5 py-2 px-2 bg-oil-amber/10 rounded border border-oil-amber/20">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-oil-amber animate-pulse shrink-0" />
                      <div className="text-[9px] text-oil-amber font-bold uppercase tracking-tight">
                        Correlation Alignment: {liveVibrations?.alignment || prediction?.quantumCorrelation?.alignment}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 pl-3.5 text-[8px] font-mono text-oil-gold/80">
                      <div>
                        CONFIDENCE:{' '}
                        <span className={`font-black uppercase ${(liveVibrations?.confidenceScore || prediction?.quantumCorrelation?.confidenceScore) === 'High' ? 'text-green-400' : (liveVibrations?.confidenceScore || prediction?.quantumCorrelation?.confidenceScore) === 'Low' ? 'text-red-400' : 'text-yellow-400'}`}>
                          {liveVibrations?.confidenceScore || prediction?.quantumCorrelation?.confidenceScore || 'Medium'}
                        </span>
                      </div>
                      <div>
                        IMPACT: <span className="font-black text-white">{liveVibrations?.impactHours || prediction?.quantumCorrelation?.impactHours || 2}H</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Strategy Deck */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                <div className="p-2 border border-oil-border rounded bg-white/5">
                  <div className="text-gray-500 text-[10px] uppercase">QUANTUM LEVERAGE</div>
                  <div className="text-oil-amber font-black italic">{prediction.strategy.leverage}</div>
                </div>
                <div className="p-2 border border-oil-border rounded bg-white/5">
                  <div className="text-gray-500 text-[10px] uppercase">SCALP ENTRY</div>
                  <div className="text-white font-mono">{prediction.strategy.entry}</div>
                </div>
                <div className="p-2 border border-oil-border rounded bg-white/5">
                  <div className="text-gray-500 text-[10px] uppercase">DYNAMIC TARGET</div>
                  <div className="text-green-400 font-mono font-bold leading-none">{prediction.strategy.target}</div>
                  <div className="text-[7px] text-green-500/50 uppercase mt-1">±$1.00 MARKET RANGE</div>
                </div>
                <div className="p-2 border border-oil-border rounded bg-white/5">
                  <div className="text-gray-500 text-[10px] uppercase">DYNAMIC SAFETY</div>
                  <div className="text-red-400 font-mono">{prediction.strategy.stopLoss}</div>
                  <div className="text-[7px] text-red-500/50 uppercase mt-1">±$1.00 RISK BRIDGE</div>
                </div>
              </div>

              {prediction.forecastTrajectory && (
                <PredictionChart data={prediction.forecastTrajectory} />
              )}

              {/* Backtest Analysis Section */}
              {prediction.backtest && (
                <div className="pt-3 border-t border-white/5 space-y-3">
                  <div className="flex flex-col gap-2 bg-oil-gold/10 px-2 py-2 rounded">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-oil-gold uppercase text-[9px] font-black tracking-widest">
                        <Database size={12} />
                        Quantum Backtest
                      </div>
                      <div className="flex flex-wrap gap-1 justify-end max-w-[180px]">
                        {['1h', '4h', '12h', '72h', '1w', '1m'].map((p) => (
                          <button
                            key={p}
                            onClick={() => {
                              setBacktestPeriod(p);
                              generatePrediction(p);
                            }}
                            className={`text-[8px] px-1.5 py-0.5 rounded border transition-all ${
                              backtestPeriod === p 
                                ? 'bg-oil-gold text-black border-oil-gold font-bold' 
                                : 'bg-transparent text-gray-400 border-white/10 hover:border-oil-gold/40'
                            }`}
                          >
                            {p.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => generatePrediction()}
                      disabled={loading}
                      className="w-full py-1.5 bg-oil-gold/20 hover:bg-oil-gold/30 border border-oil-gold/40 rounded flex items-center justify-center gap-2 text-oil-gold text-[10px] font-black uppercase tracking-[0.2em] transition-all group active:scale-[0.98]"
                    >
                      <RefreshCcw size={10} className={loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
                      SCAN MATRIX: {backtestPeriod.toUpperCase()}
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 bg-black/30 rounded border border-white/5 text-center">
                      <div className="text-[7px] text-gray-500 uppercase">Win Rate</div>
                      <div className="text-xs font-bold text-green-400">{(prediction.backtest.winRate * 100).toFixed(0)}%</div>
                    </div>
                    <div className="p-2 bg-black/30 rounded border border-white/5 text-center">
                      <div className="text-[7px] text-gray-500 uppercase">Profit Factor</div>
                      <div className="text-xs font-bold text-oil-gold">{prediction.backtest.profitFactor.toFixed(2)}</div>
                    </div>
                    <div className="p-2 bg-black/30 rounded border border-white/5 text-center">
                      <div className="text-[7px] text-gray-500 uppercase">Max DD</div>
                      <div className="text-xs font-bold text-red-400">{(prediction.backtest.maxDrawdown * 100).toFixed(1)}%</div>
                    </div>
                  </div>
                  <div className="text-[8px] text-gray-500 font-mono text-center">
                    Sample Size: <span className="text-white">{prediction.backtest.sampleSize} Simulated Matrix Trades</span>
                  </div>
                </div>
              )}

              <div className="pt-2 flex flex-col gap-1">
                <p className="text-[8px] text-gray-600 leading-tight">
                  Vectors generated via Astro-Market Synthesis. Leveraged derivatives carry total recursive risk.
                </p>
                <div className="flex items-center justify-between">
                  <a 
                    href="https://horoscopes.astro-seek.com/current-planets-astrology-transits-planetary-positions" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[7px] text-oil-gold/40 hover:text-oil-gold/80 transition-colors uppercase font-bold tracking-tighter"
                  >
                    Astro Data: Astro-Seek (Live Transits)
                  </a>
                  <span className="text-[7px] text-gray-600/50 font-mono italic">SYNC_VERIFIED: 2026-04-20</span>
                </div>
              </div>
            </motion.div>
          ) : (
             !loading && <div className="text-gray-600 italic">Initialize terminal to begin cosmic market tracking.</div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Footer bar */}
      <div className="bg-oil-dim border-t border-oil-border p-2 flex justify-between items-center shrink-0">
        <div className="flex gap-4">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] text-gray-400 font-mono">LIVE FEED</span>
          </div>
          <div className="flex items-center gap-1">
             <span className="text-[10px] text-gray-400 font-mono">TPS: 144Hz</span>
          </div>
        </div>
        <div className="text-[10px] text-gray-500 font-mono">
          © {new Date().getFullYear()} ASTROQUANT SYSTEMS
        </div>
      </div>
    </div>
  );
}
