/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PlanetaryPosition } from '../types';
import { Sparkles, Moon, Sun, Zap, RotateCcw, Link2 } from 'lucide-react';
import { motion } from 'motion/react';
import { getActiveAspects } from '../lib/astrology';

interface Props {
  planets: PlanetaryPosition[];
}

export function AstroPanel({ planets }: Props) {
  const activeAspects = getActiveAspects(planets).slice(0, 3);

  return (
    <div className="p-4 bg-oil-dim border border-oil-border rounded-lg h-full overflow-y-auto">
      <div className="flex items-center gap-2 mb-4 text-oil-gold border-b border-oil-border pb-2">
        <Sparkles size={18} />
        <h2 className="font-display uppercase tracking-widest text-sm">Celestial Matrix</h2>
      </div>
      
      <div className="grid grid-cols-1 gap-2 mb-6">
        {planets.map((p) => (
          <motion.div 
            key={p.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center justify-between p-2.5 rounded bg-white/[0.02] border border-white/5 hover:bg-white/5 hover:border-oil-gold/20 transition-all group cursor-default"
          >
            <div className="flex items-center gap-3">
              <div className="text-xs font-mono text-oil-amber group-hover:scale-110 transition-transform">
                {p.name === 'Sun' ? <Sun size={14} /> : p.name === 'Moon' ? <Moon size={14} /> : <Zap size={14} />}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase text-gray-500 font-mono tracking-tighter">{p.name}</span>
                  {p.retrograde && (
                    <div className="flex items-center gap-0.5 px-1 bg-red-500/10 border border-red-500/20 rounded text-[7px] text-red-400 font-black tracking-tighter uppercase animate-pulse">
                      <RotateCcw size={8} />
                      Retrograde
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-black text-white tracking-tight">
                    {p.degree}° {p.sign} {p.minute}'
                  </div>
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-oil-gold/20 border border-oil-gold/40 text-[10px] font-black text-oil-gold shadow-[0_0_8px_rgba(212,175,55,0.2)]">
                    {p.numerology}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-right flex flex-col items-end opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="text-[8px] text-oil-gold font-mono font-bold tracking-widest uppercase">Matrix Sync</div>
              <div className="w-1.5 h-1.5 rounded-full bg-oil-gold animate-ping" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Active Aspects Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-oil-gold/60 border-b border-oil-border/50 pb-1.5">
          <Link2 size={14} />
          <h3 className="text-[10px] font-bold uppercase tracking-widest">Active Geometric Aspects</h3>
        </div>
        
        <div className="grid grid-cols-1 gap-2">
          {activeAspects.map((aspect, idx) => (
            <motion.div
              key={`${aspect.p1}-${aspect.p2}-${idx}`}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-2 bg-white/[0.01] border border-white/5 rounded flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-mono text-white/80">{aspect.p1}</span>
                  <div className="w-2 h-[1px] bg-oil-gold/30" />
                  <span className="text-[9px] font-mono text-white/80">{aspect.p2}</span>
                </div>
                <div className={`text-[8px] font-black px-1 rounded ${
                  aspect.strength === 'High' ? 'bg-oil-gold text-black' : 
                  aspect.strength === 'Medium' ? 'bg-oil-gold/20 text-oil-gold' : 
                  'bg-white/5 text-gray-500'
                }`}>
                  {aspect.strength}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-oil-amber uppercase italic tracking-tighter">
                  {aspect.type}
                </span>
                <span className="text-[9px] font-mono text-gray-500">
                  Orb: {aspect.orb.toFixed(2)}°
                </span>
              </div>
              
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(0, 100 - (aspect.orb / 8) * 100)}%` }}
                  className={`h-full ${
                    aspect.strength === 'High' ? 'bg-oil-gold' : 
                    aspect.strength === 'Medium' ? 'bg-oil-gold/50' : 
                    'bg-white/20'
                  }`}
                />
              </div>
            </motion.div>
          ))}
          {activeAspects.length === 0 && (
            <div className="text-[10px] text-gray-600 italic py-2">No significant aspects detected.</div>
          )}
        </div>
      </div>
    </div>
  );
}
