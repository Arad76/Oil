/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { History, Activity, Database, Satellite, Zap } from 'lucide-react';

interface DataPoint {
  timestamp: number;
  wtiPrice: number | null;
  astro: {
    positions: any[];
    aspects: any[];
  };
}

export function HistoricalLog() {
  const [history, setHistory] = useState<DataPoint[]>([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/history');
        const data = await res.json();
        setHistory(data.reverse()); // Latest first
      } catch (err) {
        console.error("History Matrix Offline");
      }
    };

    fetchHistory();
    const interval = setInterval(fetchHistory, 60000); // Sync every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex flex-col bg-oil-black text-[10px] font-mono">
      <div className="p-3 border-b border-white/5 flex items-center justify-between bg-oil-dim/50">
        <div className="flex items-center gap-2 text-oil-gold uppercase font-black tracking-widest">
          <Database size={14} />
          TS_MATRIX_FEED
        </div>
        <div className="flex items-center gap-1.5 text-[8px] text-green-500 font-bold px-2 py-0.5 rounded bg-green-500/10">
          <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
          SYNCED
        </div>
      </div>
      
      <div className="p-3 grid grid-cols-2 gap-2 border-b border-white/5 bg-black/40">
        <div className="flex flex-col gap-1 p-2 rounded bg-white/5 border border-white/5">
          <div className="flex items-center gap-1.5 text-gray-500 font-bold uppercase text-[7px]">
            <Activity size={10} className="text-oil-amber" />
            TradingView [WTI]
          </div>
          <div className="text-[9px] text-white font-black">
            {history[0]?.wtiPrice ? `$${history[0].wtiPrice.toFixed(2)}` : 'SCANNING...'}
          </div>
        </div>
        <div className="flex flex-col gap-1 p-2 rounded bg-white/5 border border-white/5">
          <div className="flex items-center gap-1.5 text-gray-500 font-bold uppercase text-[7px]">
            <Satellite size={10} className="text-oil-amber" />
            AstroSeek [SKY]
          </div>
          <div className="text-[9px] text-white font-black truncate">
            {history[0]?.astro?.aspects[0]?.type || 'HARMONIC'}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {history.length > 0 ? (
          <div className="divide-y divide-white/[0.02]">
            {history.map((h, i) => (
              <div key={i} className="p-2.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                <div className="flex flex-col">
                  <span className="text-gray-500 text-[8px] font-bold">
                    {new Date(h.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-oil-gold font-black">
                    {h.wtiPrice ? `$${h.wtiPrice.toFixed(2)}` : 'NULL'}
                  </span>
                </div>
                <div className="text-right flex flex-col items-end">
                   <div className="flex gap-1">
                      {h.astro.aspects.slice(0, 2).map((a: any, idx: number) => (
                        <div key={idx} className="w-1.5 h-1.5 rounded-full bg-oil-amber/40" title={a.type} />
                      ))}
                   </div>
                   <span className="text-gray-600 text-[7px] uppercase mt-1">
                      {h.astro.positions[0]?.sign.substring(0,3)} / {h.astro.positions[1]?.sign.substring(0,3)}
                   </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-2 p-6 text-center opacity-30">
            <Zap size={24} strokeWidth={1} />
            <span className="italic uppercase tracking-widest text-[8px]">Initializing Pipeline...</span>
          </div>
        )}
      </div>
    </div>
  );
}
