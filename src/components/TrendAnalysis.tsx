
import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, TrendingDown, Zap, BarChart3, Binary, ShieldAlert } from 'lucide-react';
import { io } from 'socket.io-client';

interface PlanetaryPosition {
  name: string;
  lon: number;
  sign: string;
  retrograde: boolean;
}

interface AstroAspect {
  planets: string[];
  type: string;
  orb: number;
}

interface DataPoint {
  timestamp: number;
  wtiPrice: number | null;
  astro: {
    positions: PlanetaryPosition[];
    aspects: AstroAspect[];
  };
}

export function TrendAnalysis() {
  const [history, setHistory] = useState<DataPoint[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);

  useEffect(() => {
    // Sync with market data
    fetch('/api/history')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setHistory(data.slice(-50));
          if (data.length > 0) setCurrentPrice(data[data.length - 1].wtiPrice);
        }
      });

    const socket = io(window.location.origin);
    socket.on("market-sync", (point: DataPoint) => {
      setCurrentPrice(point.wtiPrice);
      setHistory(prev => [...prev, point].slice(-50));
    });

    return () => { socket.disconnect(); };
  }, []);

  const analysis = useMemo(() => {
    if (history.length < 10 || !currentPrice) return null;

    // 1. Technical Momentum (Short-term SMA cross)
    const prices = history.map(h => h.wtiPrice || 0);
    const sma10 = prices.slice(-10).reduce((a, b) => a + b, 0) / 10;
    const momentum = currentPrice - sma10;
    
    // 2. Astro Alignment Score
    // Harmonious (Trine/Sextile) = Positive bias
    // Challenging (Square/Opposition) = Volatility/Negative bias
    const lastAstro = history[history.length - 1].astro;
    let astroScore = 0;
    lastAstro.aspects.forEach(a => {
      if (a.type === 'Trine' || a.type === 'Sextile') astroScore += 2;
      if (a.type === 'Square' || a.type === 'Opposition') astroScore -= 2;
      if (a.type === 'Conjunction') astroScore += 1;
    });

    // 3. Overall Directionality
    const totalScore = (momentum * 10) + astroScore;
    const direction = totalScore > 0 ? 'BULLISH' : totalScore < 0 ? 'BEARISH' : 'NEUTRAL';
    const strength = Math.min(Math.abs(totalScore) * 10, 100);

    return {
      direction,
      strength,
      momentum: momentum.toFixed(4),
      astroScore,
      activeAspects: lastAstro.aspects.length
    };
  }, [history, currentPrice]);

  if (!analysis) return null;

  return (
    <div className="bg-oil-dim border border-oil-border rounded-lg p-4 relative overflow-hidden h-full flex flex-col justify-between">
      <div className="absolute top-0 right-0 p-2 opacity-10">
        <Binary size={64} className="text-oil-gold" />
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-oil-gold" />
          <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Matrix Analysis</span>
        </div>
        <div className="h-1 w-12 bg-oil-gold/20 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-oil-gold"
            animate={{ width: `${analysis.strength}%` }}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-2">
        <AnimatePresence mode="wait">
          <motion.div 
            key={analysis.direction}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className={`flex flex-col items-center gap-1 ${analysis.direction === 'BULLISH' ? 'text-green-400' : 'text-red-400'}`}
          >
            {analysis.direction === 'BULLISH' ? <TrendingUp size={40} /> : <TrendingDown size={40} />}
            <span className="text-2xl font-black italic tracking-tighter leading-none">{analysis.direction}</span>
            <span className="text-[8px] font-mono text-gray-500 uppercase">Gann Fan / Fibonacci Correlation</span>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-oil-border/50">
        <div className="flex flex-col">
          <span className="text-[7px] text-gray-500 font-bold uppercase tracking-wider">Fibonacci Extensions</span>
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-white">
            <BarChart3 size={10} className="text-oil-gold" />
            {analysis.momentum} (Base)
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[7px] text-gray-500 font-bold uppercase tracking-wider text-right">Gann Angle Tension</span>
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-oil-amber italic">
            {analysis.astroScore > 0 ? '+' : ''}{analysis.astroScore} Index
            <ShieldAlert size={10} />
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-oil-gold/5 overflow-hidden">
        <motion.div 
          className="h-full bg-oil-gold/40"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
      </div>
    </div>
  );
}
