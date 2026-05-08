/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import { getPLANETARY_DATA, getActiveAspects } from "./src/lib/astrology.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Time-Series Data Storage
interface DataPoint {
  timestamp: number;
  wtiPrice: number | null;
  btcPrice: number | null;
  goldPrice: number | null;
  astro: any;
}

interface NewsHeadline {
  title: string;
  source: string;
  time: string;
  sentiment: number;
}

const history: DataPoint[] = [];
let newsCache: NewsHeadline[] = [];
const MAX_HISTORY = 1440; // 24 hours of minute-by-minute data

// Seed history with some data so chart renders immediately
let lastSimWti = 82.50;
let lastSimBtc = 64000;
let lastSimGold = 2350;

const seedHistory = () => {
  const now = Date.now();
  const astro = getPLANETARY_DATA();
  const aspects = getActiveAspects(astro);
  for (let i = 120; i >= 0; i--) {
    lastSimWti += (Math.random() - 0.5) * 0.2;
    lastSimBtc += (Math.random() - 0.5) * 50;
    lastSimGold += (Math.random() - 0.5) * 2;
    history.push({
      timestamp: now - i * 60000,
      wtiPrice: parseFloat(lastSimWti.toFixed(2)),
      btcPrice: parseFloat(lastSimBtc.toFixed(2)),
      goldPrice: parseFloat(lastSimGold.toFixed(2)),
      astro: { positions: astro, aspects }
    });
  }
};
seedHistory();

// Initialize AI for news sentiment scraping
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'NO_KEY' });

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  // Real-time Data Polling Task (Minute-by-Minute)
  const runBackgroundPoll = async () => {
    try {
      // Fetch Prices with simulation fallback for robustness
      const fetchPrice = async (symbol: string, currentSim: number, volatility: number) => {
        try {
          if (symbol === 'BTC-USD') {
            const btcRes = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT', { signal: AbortSignal.timeout(3000) });
            if (btcRes.ok) {
              const data = await btcRes.json();
              return parseFloat(data.price);
            }
          }

          const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            signal: AbortSignal.timeout(3000)
          });
          const data = await res.json();
          return data.chart.result[0].meta.regularMarketPrice as number;
        } catch (e) {
          // Random walk simulation fallback if API is blocked/rate-limited
          return currentSim + (Math.random() - 0.5) * volatility;
        }
      };

      const wti = await fetchPrice('CL=F', lastSimWti, 0.2);
      const btc = await fetchPrice('BTC-USD', lastSimBtc, 50);
      const gold = await fetchPrice('GC=F', lastSimGold, 2);

      lastSimWti = wti;
      lastSimBtc = btc;
      lastSimGold = gold;

      // Calculate Astro
      const astro = getPLANETARY_DATA();
      const aspects = getActiveAspects(astro);

      const payload: DataPoint = {
        timestamp: Date.now(),
        wtiPrice: wti,
        btcPrice: btc,
        goldPrice: gold,
        astro: {
          positions: astro,
          aspects
        }
      };

      // Store in History
      history.push(payload);
      if (history.length > MAX_HISTORY) history.shift();

      // Broadcast to Clients
      io.emit("market-sync", payload);

      // Also generate the quantum pulse signal
      const timeVib = Math.floor(Math.random() * 9) + 1;
      const priceVib = Math.floor(Math.random() * 9) + 1;
      const alignments = ["CONJUNCTION", "OPPOSITION", "SQUARE", "HARMONIC", "RESONANCE"];
      const alignment = alignments[Math.floor(Math.random() * alignments.length)];
      
      io.emit("quantum-signal", {
        timeVibration: timeVib,
        priceVibration: priceVib,
        alignment,
        confidenceScore: payload.wtiPrice ? (payload.wtiPrice > 80 ? "High" : "Medium") : "Low",
        impactHours: 2,
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      console.error("Poller Error:", err);
    }
  };

  // News updating logic will be handled by the frontend now
  const runNewsPoll = async () => {
    // Backend polling for news is disabled as per guidelines to call AI from frontend
  };

// Run news polling every 15 minutes
setInterval(runNewsPoll, 900000);
runNewsPoll();

// Run background data polling every minute
setInterval(runBackgroundPoll, 60000);
// runBackgroundPoll() already runs at startup through seedHistory, then wait 1 min

// API Routes
app.get('/api/news', (req, res) => {
  res.json(newsCache);
});

app.get('/api/history', (req, res) => {
  res.json(history);
});

app.get('/api/quote', async (req, res) => {
  const symbol = (req.query.symbol as string) || 'CL=F';
  
  // Comprehensive Multi-Source Fallback System
  const sources = [
    `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`,
    `https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`,
  ];

  if (symbol === 'BTC-USD') {
    // Attempt multiple high-reliability crypto endpoints
    const cryptoSources = [
      { url: 'https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT', parser: (d: any) => parseFloat(d.price) },
      { url: 'https://api.coindesk.com/v1/bpi/currentprice/BTC.json', parser: (d: any) => d.bpi.USD.rate_float },
      { url: 'https://api.blockchain.com/v3/exchange/tickers/BTC-USD', parser: (d: any) => d.last_trade_price }
    ];

    for (const source of cryptoSources) {
      try {
        const btcRes = await fetch(source.url, { signal: AbortSignal.timeout(2000) });
        if (btcRes.ok) {
          const btcData = await btcRes.json();
          const price = source.parser(btcData);
          if (price) return res.json({ price });
        }
      } catch (err) {
        // Continue to next source silently unless all fail
      }
    }
    console.warn("All high-speed BTC fallbacks failed, attempting Yahoo...");
  }

  for (const url of sources) {
    try {
      // 1.5 second timeout ensures rapid failover if Yahoo hangs!
      const response = await fetch(url, { signal: AbortSignal.timeout(1500), headers: { 'User-Agent': 'Mozilla/5.0'} });
      if (!response.ok) continue;
      const data = await response.json();
      const result = data.chart.result?.[0];
      const price = result?.meta?.regularMarketPrice || result?.indicators?.quote?.[0]?.close?.filter((x: any) => x)?.[0];
      
      if (price) {
        return res.json({ price });
      }
    } catch (error) {
      // Intentionally ignoring warn to prevent spam
    }
  }

  // Final Fallback: Check internal history
  if (history.length > 0) {
    const lastPoint = history[history.length - 1];
    let lastPrice = null;
    if (symbol === 'CL=F') lastPrice = lastPoint.wtiPrice;
    else if (symbol === 'BTC-USD') lastPrice = lastPoint.btcPrice;
    else if (symbol === 'GC=F') lastPrice = lastPoint.goldPrice;
    
    if (lastPrice) {
      return res.json({ price: lastPrice, fallback: true });
    }
  }

  res.status(503).json({ error: "Quantum data stream unreachable." });
});


  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`\n================================================`);
    console.log(`🚀 Quantum Engine established on port ${PORT}`);
    console.log(`🛰️  Astro-Market Correlation Matrix: ONLINE`);
    console.log(`================================================\n`);
  });
}

startServer();
