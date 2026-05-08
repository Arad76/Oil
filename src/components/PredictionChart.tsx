/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Area, ComposedChart } from 'recharts';

interface ForecastDataPoint {
  timeOffset: string;
  expectedPrice: number;
}

interface Props {
  data: ForecastDataPoint[];
}

export function PredictionChart({ data }: Props) {
  if (!data || data.length === 0) return null;

  // Calculate Fibonacci Bollinger Bands levels
  // Uncertainty typically increases with time offset in a forecast.
  const baseVolatility = 0.08; 
  const fibRatios = [1.618, 2.618, 4.236];

  const enrichedData = data.map((d, index) => {
    // Widening factor: variance grows as we move further from t-0
    const wideningFactor = 1 + (index * 0.25); 
    const currentVol = baseVolatility * wideningFactor;

    return {
      ...d,
      fibUpper3: d.expectedPrice + (currentVol * fibRatios[2]),
      fibUpper2: d.expectedPrice + (currentVol * fibRatios[1]),
      fibUpper1: d.expectedPrice + (currentVol * fibRatios[0]),
      fibLower1: d.expectedPrice - (currentVol * fibRatios[0]),
      fibLower2: d.expectedPrice - (currentVol * fibRatios[1]),
      fibLower3: d.expectedPrice - (currentVol * fibRatios[2]),
    };
  });

  const minPrice = Math.min(...enrichedData.map(d => d.fibLower3));
  const maxPrice = Math.max(...enrichedData.map(d => d.fibUpper3));
  const padding = (maxPrice - minPrice) * 0.1 || 1;

  return (
    <div className="w-full h-[180px] mt-3 bg-black/40 rounded border border-white/5 p-2 overflow-hidden relative">
      <div className="flex items-center justify-between pl-1 mb-2">
        <div className="text-[9px] text-gray-500 uppercase font-black tracking-widest font-mono flex items-center gap-2">
          <div className="w-1 h-1 rounded-full bg-oil-gold animate-pulse" />
          Gann Fan & Fibonacci Orbit
        </div>
        <div className="flex gap-2">
          {fibRatios.map((r, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="w-1.5 h-0.5" style={{ backgroundColor: `rgba(212,175,55, ${0.1 * (i + 1)})` }} />
              <span className="text-[7px] text-gray-600 font-mono">FIB/GANN {r}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="w-full h-[130px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={enrichedData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="fibGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.03)" vertical={false} />
            <XAxis 
              dataKey="timeOffset" 
              stroke="rgba(255,255,255,0.2)" 
              fontSize={8} 
              tickMargin={4}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              domain={[minPrice - padding, maxPrice + padding]} 
              stroke="rgba(255,255,255,0.2)" 
              fontSize={8}
              tickFormatter={(val) => `$${val.toFixed(2)}`}
              axisLine={false}
              tickLine={false}
              hide
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(212,175,55,0.3)', fontSize: '10px', borderRadius: '4px' }}
              labelStyle={{ color: '#D4AF37', fontWeight: 'bold', marginBottom: '4px' }}
              itemStyle={{ padding: '0px' }}
              formatter={(value: number, name: string) => {
                if (name === "expectedPrice") return [`$${value.toFixed(2)}`, 'Vector Base'];
                return null;
              }}
            />
            
            {/* Outer Fibonacci Bands */}
            <Area 
              type="monotone" 
              dataKey="fibUpper3" 
              stroke="none" 
              fill="#D4AF37" 
              fillOpacity={0.05} 
              baseValue="dataMin"
            />
            <Area 
              type="monotone" 
              dataKey="fibUpper2" 
              stroke="none" 
              fill="#D4AF37" 
              fillOpacity={0.08} 
            />
            <Area 
              type="monotone" 
              dataKey="fibUpper1" 
              stroke="none" 
              fill="#D4AF37" 
              fillOpacity={0.12} 
            />

            {/* Price Trajectory */}
            <Line 
              type="monotone" 
              dataKey="expectedPrice" 
              stroke="#D4AF37" 
              strokeWidth={2} 
              dot={{ r: 2, fill: '#D4AF37', strokeWidth: 0 }} 
              activeDot={{ r: 4, fill: '#fff', stroke: '#D4AF37', strokeWidth: 2 }} 
              isAnimationActive={true}
            />
            
            {/* Lower Bands - Visual Balance */}
            <Area 
              type="monotone" 
              dataKey="fibLower1" 
              stroke="none" 
              fill="#D4AF37" 
              fillOpacity={0.12} 
            />
            <Area 
              type="monotone" 
              dataKey="fibLower2" 
              stroke="none" 
              fill="#D4AF37" 
              fillOpacity={0.08} 
            />
            <Area 
              type="monotone" 
              dataKey="fibLower3" 
              stroke="none" 
              fill="#D4AF37" 
              fillOpacity={0.05} 
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="absolute bottom-1 right-2 text-[6px] text-gray-700 uppercase font-mono italic">
        Probability Cloud: Scalp Vector Sigma
      </div>
    </div>
  );
}
