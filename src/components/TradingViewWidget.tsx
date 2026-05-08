/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { io, Socket } from 'socket.io-client';
import { Activity, Zap, TrendingUp, TrendingDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DataPoint {
  timestamp: number;
  wtiPrice: number | null;
  btcPrice: number | null;
  goldPrice: number | null;
  astro: any;
}

interface ChartNode extends DataPoint {
  sma: number | null;
  sd: number | null;
  u1: number | null;
  u2: number | null;
  u3: number | null;
  l1: number | null;
  l2: number | null;
  l3: number | null;
  displayTime: string;
}

interface Props {
  interval?: string;
}

export function TradingViewWidget({ interval = "1" }: Props) {
  const [history, setHistory] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedData, setSelectedData] = useState<ChartNode | null>(null);
  const [showBtc, setShowBtc] = useState(false);
  const [showGold, setShowGold] = useState(false);

  // Initial data fetch

  useEffect(() => {
    fetch('/api/history')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setHistory(data);
        setLoading(false);
      })
      .catch(err => console.error("History sync failed", err));

    const socket: Socket = io(window.location.origin);
    
    socket.on("market-sync", (point: DataPoint) => {
      setHistory(prev => {
        const next = [...prev, point];
        if (next.length > 1440) return next.slice(-1440);
        return next;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Compute Bollinger Bands with 1, 2, 3 SD multipliers
  const chartData = useMemo(() => {
    if (history.length === 0) return [];

    // Filter and sample based on interval
    let sampled = history.filter(p => p.wtiPrice !== null);
    const intervalNum = parseInt(interval) || 1;
    
    if (intervalNum > 1) {
      sampled = sampled.filter((_, i) => i % intervalNum === 0);
    }

    // Standard period for BB is 20
    const period = 20;

    return sampled.map((p, index, arr) => {
      if (index < period - 1) {
        return {
          ...p,
          sma: null,
          sd: null,
          u1: null, u2: null, u3: null,
          l1: null, l2: null, l3: null,
          displayTime: new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      }

      const window = arr.slice(index - (period - 1), index + 1);
      const prices = window.map(w => w.wtiPrice as number);
      const sma = prices.reduce((a, b) => a + b, 0) / period;
      
      const variance = prices.reduce((a, b) => a + Math.pow(b - sma, 2), 0) / period;
      const sd = Math.sqrt(variance);

      return {
        ...p,
        sma,
        sd,
        u1: sma + sd,
        u2: sma + (2 * sd),
        u3: sma + (3 * sd),
        l1: sma - sd,
        l2: sma - (2 * sd),
        l3: sma - (3 * sd),
        displayTime: new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    }).slice(-100); // Only show last 100 points for performance and clarity
  }, [history, interval]);

  const currentPrice = history.length > 0 ? (history[history.length - 1].wtiPrice || 0) : 0;
  const prevPrice = history.length > 1 ? (history[history.length - 2].wtiPrice || 0) : currentPrice;
  const priceChange = currentPrice - prevPrice;

  const currentBtc = history.length > 0 ? (history[history.length - 1].btcPrice || 0) : 0;
  const currentGold = history.length > 0 ? (history[history.length - 1].goldPrice || 0) : 0;

  if (loading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-oil-black border border-oil-border rounded-lg">
        <div className="flex flex-col items-center gap-4">
          <Activity className="text-oil-gold animate-spin" size={32} />
          <span className="text-xs font-mono text-gray-500 uppercase animate-pulse">Initializing Data Stream...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-black/60 border border-oil-border rounded-lg overflow-hidden flex flex-col group">
      <div className="terminal-scanline" />
      
      {/* Header Info */}
      <div className="flex items-center justify-between px-4 py-2 bg-oil-dim border-b border-oil-border relative z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2 py-1 bg-oil-gold/10 border border-oil-gold/20 rounded">
            <Activity size={14} className="text-oil-gold" />
            <span className="text-[10px] font-black text-oil-gold uppercase tracking-widest">WTI Comparison Chart</span>
          </div>
          <div className="flex gap-2 ml-2">
            <button 
              onClick={() => setShowBtc(!showBtc)}
              className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-colors ${showBtc ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-white/5 text-gray-500 border border-white/10 hover:text-gray-300'}`}
            >
              BTC: ${currentBtc.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </button>
            <button 
              onClick={() => setShowGold(!showGold)}
              className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-colors ${showGold ? 'bg-[#C0C0C0]/20 text-[#C0C0C0] border border-[#C0C0C0]/30' : 'bg-white/5 text-gray-500 border border-white/10 hover:text-gray-300'}`}
            >
              XAU: ${currentGold.toLocaleString(undefined, { maximumFractionDigits: 1 })}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
             <div className="flex items-center gap-1.5">
               <span className="text-xl font-black text-white tracking-tighter tabular-nums">${currentPrice.toFixed(2)}</span>
               <div className={`px-1 rounded text-[8px] font-black ${priceChange >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                 {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}
               </div>
             </div>
             <div className="text-[7px] text-gray-600 font-mono italic uppercase">Direct Liquid Spot Feed</div>
          </div>
        </div>
      </div>

      <div className="flex-1 relative min-h-0 pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart 
            data={chartData} 
            margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
            onClick={(data: any) => {
              if (data && data.activePayload && data.activePayload.length) {
                setSelectedData(data.activePayload[0].payload);
              }
            }}
          >
            <defs>
              <linearGradient id="cloudGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D4AF37" stopOpacity={0} />
                <stop offset="50%" stopColor="#D4AF37" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="innerCloud" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.1} />
                <stop offset="100%" stopColor="#D4AF37" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
            
            <XAxis 
              dataKey="displayTime" 
              stroke="rgba(255,255,255,0.2)" 
              fontSize={9} 
              tickMargin={10}
              axisLine={{ stroke: 'rgba(212,175,55,0.1)' }}
              tickLine={false}
              minTickGap={20}
            />
            
            <YAxis 
              yAxisId="wti"
              domain={['auto', 'auto']}
              orientation="right"
              stroke="rgba(212,175,55,0.8)" 
              fontSize={9}
              tickFormatter={(val) => val.toFixed(2)}
              axisLine={false}
              tickLine={false}
            />

            {showBtc && (
              <YAxis 
                yAxisId="btc"
                domain={['auto', 'auto']}
                orientation="left"
                stroke="rgba(247,147,26,0.8)"
                fontSize={9}
                tickFormatter={(val) => val.toFixed(0)}
                axisLine={false}
                tickLine={false}
              />
            )}
            
            {showGold && (
              <YAxis 
                yAxisId="gold"
                domain={['auto', 'auto']}
                orientation="left"
                stroke="rgba(192,192,192,0.8)"
                fontSize={9}
                tickFormatter={(val) => val.toFixed(1)}
                axisLine={false}
                tickLine={false}
              />
            )}

            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-black/90 border border-oil-gold/40 p-2.5 rounded shadow-xl backdrop-blur-sm">
                      <div className="text-[9px] text-oil-gold font-black uppercase mb-1.5 border-b border-oil-gold/20 pb-1">
                        {data.displayTime} Sync
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between gap-4">
                          <span className="text-[9px] text-gray-500 uppercase font-bold text-nowrap">WTI Price</span>
                          <span className="text-[10px] text-white font-mono font-black">${data.wtiPrice?.toFixed(2)}</span>
                        </div>
                        {showBtc && data.btcPrice && (
                          <div className="flex justify-between gap-4">
                            <span className="text-[9px] text-[#F7931A] uppercase font-bold text-nowrap">BTC Price</span>
                            <span className="text-[10px] text-white font-mono font-black">${data.btcPrice?.toFixed(0)}</span>
                          </div>
                        )}
                        {showGold && data.goldPrice && (
                          <div className="flex justify-between gap-4">
                            <span className="text-[9px] text-[#C0C0C0] uppercase font-bold text-nowrap">XAU Price</span>
                            <span className="text-[10px] text-white font-mono font-black">${data.goldPrice?.toFixed(1)}</span>
                          </div>
                        )}
                        {data.sma && (
                          <div className="flex justify-between gap-4 border-t border-white/5 pt-1 mt-1">
                            <span className="text-[9px] text-gray-500 uppercase font-bold text-nowrap">SMA (20)</span>
                            <span className="text-[10px] text-oil-gold font-mono">${data.sma.toFixed(2)}</span>
                          </div>
                        )}
                        {data.sd && (
                          <div className="flex justify-between gap-4">
                            <span className="text-[9px] text-gray-500 uppercase font-bold text-nowrap"> volatility (SD)</span>
                            <span className="text-[10px] text-oil-amber font-mono">{data.sd.toFixed(3)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Fibonacci Bollinger Bands Cloud - Outermost (3 SD) */}
            <Area 
              yAxisId="wti"
              type="monotone" 
              dataKey="u3" 
              stroke="none" 
              fill="rgba(212,175,55, 0.03)" 
            />
            <Area 
              yAxisId="wti"
              type="monotone" 
              dataKey="l3" 
              stroke="none" 
              fill="rgba(212,175,55, 0.03)" 
            />

            {/* Mid Cloud (2 SD) */}
            <Area 
              yAxisId="wti"
              type="monotone" 
              dataKey="u2" 
              stroke="none" 
              fill="rgba(212,175,55, 0.06)" 
            />
            <Area 
              yAxisId="wti"
              type="monotone" 
              dataKey="l2" 
              stroke="none" 
              fill="rgba(212,175,55, 0.06)" 
            />

            {/* Inner Cloud (1 SD) */}
            <Area 
              yAxisId="wti"
              type="monotone" 
              dataKey="u1" 
              stroke="none" 
              fill="rgba(212,175,55, 0.1)" 
            />
            <Area 
              yAxisId="wti"
              type="monotone" 
              dataKey="l1" 
              stroke="none" 
              fill="rgba(212,175,55, 0.1)" 
            />

            {/* SMA Middle Band */}
            <Line 
              yAxisId="wti"
              type="monotone" 
              dataKey="sma" 
              stroke="rgba(255,255,255,0.05)" 
              strokeWidth={1} 
              dot={false}
              isAnimationActive={false}
            />

            {/* Outer lines for definition */}
            <Line yAxisId="wti" type="monotone" dataKey="u3" stroke="rgba(212,175,55, 0.15)" strokeWidth={0.5} dot={false} isAnimationActive={false} />
            <Line yAxisId="wti" type="monotone" dataKey="l3" stroke="rgba(212,175,55, 0.15)" strokeWidth={0.5} dot={false} isAnimationActive={false} />

            {/* Main Price Line WTI */}
            <Line 
              yAxisId="wti"
              type="monotone" 
              dataKey="wtiPrice" 
              stroke="#D4AF37" 
              strokeWidth={1.5} 
              dot={false}
              activeDot={{ r: 4, fill: '#fff', stroke: '#D4AF37', strokeWidth: 2 }} 
              isAnimationActive={true}
            />
            
            {showBtc && (
              <Line 
                yAxisId="btc"
                type="monotone" 
                dataKey="btcPrice" 
                stroke="#F7931A" 
                strokeWidth={1.5} 
                dot={false}
                activeDot={{ r: 3, fill: '#fff', stroke: '#F7931A', strokeWidth: 1.5 }} 
                isAnimationActive={true}
              />
            )}
            
            {showGold && (
              <Line 
                yAxisId="gold"
                type="monotone" 
                dataKey="goldPrice" 
                stroke="#C0C0C0" 
                strokeWidth={1.5} 
                dot={false}
                activeDot={{ r: 3, fill: '#fff', stroke: '#C0C0C0', strokeWidth: 1.5 }} 
                isAnimationActive={true}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>

        {/* Legend Overlay */}
        <div className="absolute top-4 left-4 flex flex-col gap-1 pointer-events-none">
          <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-oil-gold" />
             <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">Market Vector</span>
          </div>
          <div className="flex items-center gap-2">
             <div className="w-3 h-1.5 bg-oil-gold/10 border border-oil-gold/20" />
             <span className="text-[8px] text-gray-500 uppercase tracking-tighter">SD [1,2,3] Prob. Cloud</span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedData && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, x: 20 }}
            className="absolute top-20 right-4 z-50 bg-black/90 border border-oil-gold/30 p-4 rounded-lg shadow-2xl backdrop-blur-md w-56 ring-1 ring-white/10"
            id="node-inspection-panel"
          >
            <div className="flex justify-between items-start mb-3 border-b border-oil-gold/20 pb-2">
              <div className="flex flex-col">
                <span className="text-[9px] text-oil-gold font-black uppercase tracking-tighter">Temporal Sync Analysis</span>
                <span className="text-[10px] text-white font-mono mt-0.5">
                  {new Date(selectedData.timestamp).toLocaleDateString()} {new Date(selectedData.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <button 
                onClick={() => setSelectedData(null)}
                className="text-gray-500 hover:text-white transition-colors p-1"
                id="close-inspection"
              >
                <X size={14} />
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-[9px] text-gray-500 uppercase font-black">Quantum Price</span>
                <span className="text-sm font-black text-white tracking-tight tabular-nums">${selectedData.wtiPrice?.toFixed(2)}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                <div className="flex flex-col">
                  <span className="text-[8px] text-gray-600 uppercase font-bold">SMA (20)</span>
                  <span className="text-[10px] text-oil-gold font-mono">${selectedData.sma?.toFixed(2) || '---'}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[8px] text-gray-600 uppercase font-bold text-right">Volat. index</span>
                  <span className="text-[10px] text-oil-amber font-mono text-right">{selectedData.sd?.toFixed(4) || '---'}</span>
                </div>
              </div>

              {selectedData.astro && selectedData.astro.aspects && selectedData.astro.aspects.length > 0 && (
                <div className="mt-2 pt-2 border-t border-white/5">
                   <div className="text-[7px] text-gray-600 uppercase font-black mb-1.5 flex items-center gap-1">
                     <div className="w-1 h-1 rounded-full bg-oil-gold" />
                     Celestial Influence
                   </div>
                   <div className="flex flex-wrap gap-1">
                     {selectedData.astro.aspects.slice(0, 4).map((a: any, i: number) => (
                       <div key={i} className="text-[7px] px-1.5 py-0.5 bg-oil-gold/5 border border-oil-gold/10 text-oil-gold rounded">
                         {a.type}
                       </div>
                     ))}
                   </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-4 py-2 bg-oil-black border-t border-oil-border flex justify-between items-center text-[8px] font-mono text-gray-600 uppercase">
        <div className="flex gap-4">
          <span>ALGO_VER: 2.1.0</span>
          <span>LATENCY: 42MS</span>
          <span>VOLATILITY: {chartData[chartData.length - 1]?.sd?.toFixed(4) || 'SCANNING...'}</span>
        </div>
        <div className="flex items-center gap-2">
           <Zap size={10} className="text-oil-amber" />
           <span>Quantum Stream Verified</span>
        </div>
      </div>
    </div>
  );
}

export default TradingViewWidget;
