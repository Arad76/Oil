/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import TradingViewWidget from './components/TradingViewWidget';
import LivePriceTape from './components/LivePriceTape';
import SingleQuoteWidget from './components/SingleQuoteWidget';
import { TrendAnalysis } from './components/TrendAnalysis';
import { AstroPanel } from './components/AstroPanel';
import { AstroWheel } from './components/AstroWheel';
import { PredictionTerminal } from './components/PredictionTerminal';
import { HistoricalLog } from './components/HistoricalLog';
import { getPLANETARY_DATA } from './lib/astrology';
import { getDayNumerology } from './lib/numerology';
import { AstroData, NumerologyData } from './types';
import { Activity, Globe, Compass, BarChart3, Database } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [astroData, setAstroData] = useState<AstroData | null>(null);
  const [numerology, setNumerology] = useState<NumerologyData | null>(null);
  const [chartInterval, setChartInterval] = useState("1");

  useEffect(() => {
    // Initial data load
    const now = new Date();
    setAstroData({
      timestamp: now.toISOString(),
      planets: getPLANETARY_DATA(now)
    });
    setNumerology(getDayNumerology(now));

    // UI time ticker update every second without heavy calculations
    const displayTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Initial fetch handled by useState defaults, update every minute
    const astroTimer = setInterval(() => {
      const now = new Date();
      setAstroData({
        timestamp: now.toISOString(),
        planets: getPLANETARY_DATA(now)
      });
      setNumerology(getDayNumerology(now));
    }, 60000);

    return () => {
      clearInterval(displayTimer);
      clearInterval(astroTimer);
    };
  }, []);

  const intervals = [
    { label: "1M", value: "1", description: "Minute Sync" },
    { label: "1H", value: "60", description: "Hourly Orbit" },
    { label: "1D", value: "D", description: "Daily Cycle" },
    { label: "1W", value: "W", description: "Weekly Portal" },
    { label: "1M", value: "M", description: "Monthly Eon" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-oil-black text-gray-200">
      {/* Dynamic Header */}
      <header className="h-14 border-b border-oil-border bg-oil-dim flex items-center justify-between px-6 shrink-0 relative z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-oil-gold rounded-full flex items-center justify-center text-black font-display font-black text-xl italic shadow-[0_0_15px_rgba(212,175,55,0.3)]">
              A
            </div>
            <h1 className="font-display text-lg font-bold tracking-tight text-white hidden sm:block">
              ASTROQUANT <span className="text-oil-gold italic font-extrabold">PROPHET</span>
            </h1>
          </div>
          
          <div className="h-4 w-[1px] bg-oil-border mx-2" />
          
          <div className="flex items-center gap-6 text-[10px] uppercase font-mono tracking-widest text-gray-400">
            <div className="flex items-center gap-1.5">
              <Globe size={12} className="text-oil-amber" />
              <span>SKY SYNC: <span className="text-white">ACTIVE</span></span>
            </div>
            <div className="flex items-center gap-1.5">
              <BarChart3 size={12} className="text-oil-amber" />
              <span>ASSET: <span className="text-white">WTI CRUDE</span></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
           <div className="flex flex-col items-end">
              <span className="text-[10px] text-gray-500 font-mono tracking-tighter">COSMIC TIME (UTC)</span>
              <span className="text-sm font-mono text-white tabular-nums">
                {currentTime.toUTCString().split(' ')[4]}
              </span>
           </div>
           
           <div className="h-8 w-[1px] bg-oil-border" />
           
           <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-3 py-1 rounded">
              <div className="w-2 h-2 rounded-full bg-oil-gold animate-pulse shadow-[0_0_8px_rgba(212,175,55,0.5)]" />
              <div className="flex flex-col">
                <span className="text-[9px] text-gray-500 font-bold uppercase leading-none">Day Vibration</span>
                <span className="text-xs font-mono font-bold text-oil-gold">
                  {numerology ? `${numerology.dayNumber} - ${numerology.vibration}` : '---'}
                </span>
              </div>
           </div>
        </div>
      </header>

      {/* Live Ticker Ribbon */}
      <LivePriceTape />

      {/* Workspace */}
      <main className="flex-1 flex flex-col md:flex-row gap-0 overflow-hidden">
        
        {/* Left Sidebar: Astro Matrix */}
        <aside className="w-full md:w-80 shrink-0 border-r border-oil-border bg-oil-black overflow-y-auto hidden lg:block">
          <div className="p-3 border-b border-oil-border flex items-center justify-between text-gray-400">
            <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest">
              <Compass size={12} />
              Navigation
            </div>
            <Database size={12} />
          </div>
          <div className="h-[calc(100vh-146px)] flex flex-col">
            <div className="shrink-0 border-b border-white/5 py-4">
              {astroData && <AstroWheel astro={astroData} />}
            </div>
            <div className="flex-1 overflow-y-auto border-b border-oil-border mt-2">
              {astroData && <AstroPanel planets={astroData.planets} />}
            </div>
            <div className="h-64 shrink-0 bg-oil-dim/50">
              <HistoricalLog />
            </div>
          </div>
        </aside>

        {/* Center: Live Chart */}
        <section className="flex-1 flex flex-col p-4 bg-[#0a0a0a]">
          <div className="flex items-center justify-between mb-3">
             <div className="flex items-center gap-2">
                <Activity size={14} className="text-oil-amber" />
                <span className="text-xs font-mono uppercase text-gray-400">TradingView Real-Time Engine</span>
             </div>
             <div className="flex gap-2">
                {intervals.map((int) => (
                  <button
                    key={int.value}
                    onClick={() => setChartInterval(int.value)}
                    className={`px-3 py-0.5 border rounded text-[10px] font-mono transition-all duration-200 ${
                      chartInterval === int.value 
                        ? 'border-oil-gold text-oil-gold bg-oil-gold/10' 
                        : 'border-oil-border text-gray-500 hover:border-gray-400'
                    }`}
                    title={int.description}
                  >
                    {int.label}
                  </button>
                ))}
                <div className="px-2 py-0.5 border border-oil-gold/30 rounded text-[10px] font-mono text-oil-gold bg-oil-gold/5 font-bold italic">LIVE</div>
             </div>
          </div>
          
          <div className="flex-1 min-h-0 relative">
            <TradingViewWidget interval={chartInterval} />
          </div>
        </section>

        {/* Right Sidebar: Prediction Engine */}
        <aside className="w-full md:w-96 shrink-0 border-l border-oil-border bg-oil-dim flex flex-col">
          <div className="p-4 border-b border-oil-border">
             <div className="text-[10px] uppercase font-bold text-gray-500 mb-2">Live Price Monitor</div>
             <SingleQuoteWidget />
          </div>
          <div className="p-4 border-b border-oil-border bg-oil-black/20 h-48">
             <TrendAnalysis />
          </div>
          <div className="flex-1 p-4 overflow-hidden">
             {astroData && numerology && <PredictionTerminal astro={astroData} numerology={numerology} />}
          </div>
          
          {/* Numerology Depth */}
          <div className="p-4 border-t border-oil-border bg-oil-black/50">
             <div className="text-[10px] uppercase font-bold text-gray-500 mb-2 flex items-center gap-2">
               <span className="w-1 h-1 bg-oil-amber rounded-full" />
               Current Vibration Meanings
             </div>
             <p className="text-[11px] text-gray-400 italic leading-relaxed">
               "{numerology?.meaning || 'Synchronizing with the universe...'}"
             </p>
             <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="flex flex-col border-l border-oil-gold/50 pl-2">
                  <span className="text-[9px] text-gray-500 uppercase">Oil Sign</span>
                  <span className="text-xs font-medium text-white truncate">Scorpio (8)</span>
                </div>
                <div className="flex flex-col border-l border-oil-gold/50 pl-2">
                  <span className="text-[9px] text-gray-500 uppercase">Liquid Sign</span>
                  <span className="text-xs font-medium text-white truncate">Pisces (12)</span>
                </div>
                <div className="flex flex-col border-l border-oil-gold/50 pl-2">
                  <span className="text-[9px] text-gray-500 uppercase">Energy</span>
                  <span className="text-xs font-medium text-white truncate">Mars (0)</span>
                </div>
             </div>
          </div>
        </aside>
      </main>

      {/* Mobile Overlays - simplified for this build */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50">
        <button className="w-12 h-12 bg-oil-gold rounded-full flex items-center justify-center text-black shadow-xl">
           <Compass size={24} />
        </button>
      </div>
    </div>
  );
}
