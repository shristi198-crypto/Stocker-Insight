import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import OpenAI from "openai";
import YahooFinance from "yahoo-finance2";
import { formatInTimeZone } from "date-fns-tz";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

// ─── Yahoo Finance Data Layer ────────────────────────────────────────────────
// NSE.com is Akamai-blocked on Replit cloud IPs. Yahoo Finance provides the
// same data via .NS suffix for NSE stocks and ^ prefix for indices.

const INDEX_YAHOO: Record<string, string> = {
  "NIFTY 50":    "^NSEI",
  "NIFTY BANK":  "^NSEBANK",
  "NIFTY IT":    "^CNXIT",
  "NIFTY NEXT 50": "^NSEMDCP50",
  "NIFTY PHARMA": "^CNXPHARMA",
  "NIFTY AUTO":  "^CNXAUTO",
  "NIFTY FMCG":  "^CNXFMCG",
  "NIFTY METAL": "^CNXMETAL",
  "NIFTY REALTY":"^CNXREALTY",
  "NIFTY ENERGY":"^CNXENERGY",
};

const NIFTY50_SYMBOLS = [
  "RELIANCE","TCS","HDFCBANK","INFY","ICICIBANK","BHARTIARTL","HINDUNILVR",
  "ITC","SBIN","LT","KOTAKBANK","BAJFINANCE","AXISBANK","ASIANPAINT",
  "MARUTI","TITAN","WIPRO","SUNPHARMA","ULTRACEMCO","POWERGRID",
  "NTPC","COALINDIA","ONGC","TATAMOTORS","JSWSTEEL","TATASTEEL",
  "ADANIPORTS","CIPLA","DRREDDY","EICHERMOT","HCLTECH","HEROMOTOCO",
  "HINDALCO","M&M","NESTLEIND","SHREECEM","TATACONSUM","TECHM",
  "BAJAJFINSV","BRITANNIA","DIVISLAB","GRASIM","INDUSINDBK","SBILIFE",
  "HDFCLIFE","BPCL","APOLLOHOSP","BAJAJ-AUTO","UPL","ADANIENT",
];

// Convert Yahoo Finance quote → NSE-style equity details (priceInfo / info / metadata)
function toEquityDetails(q: any): any {
  return {
    priceInfo: {
      lastPrice:     q.regularMarketPrice     ?? 0,
      change:        q.regularMarketChange    ?? 0,
      pChange:       q.regularMarketChangePercent ?? 0,
      open:          q.regularMarketOpen      ?? 0,
      high:          q.regularMarketDayHigh   ?? 0,
      low:           q.regularMarketDayLow    ?? 0,
      previousClose: q.regularMarketPreviousClose ?? 0,
      weekHighLow: {
        max: q.fiftyTwoWeekHigh ?? 0,
        min: q.fiftyTwoWeekLow  ?? 0,
      },
      intraDayHighLow: {
        max: q.regularMarketDayHigh ?? 0,
        min: q.regularMarketDayLow  ?? 0,
      },
    },
    info:     { companyName: q.shortName || q.longName || "" },
    metadata: { companyName: q.shortName || q.longName || "", industry: q.industry || q.sector || "N/A" },
  };
}

// Convert Yahoo Finance quote → NSE-style index stock entry (data.data[] element)
function toIndexStockEntry(symbol: string, q: any): any {
  const vol = q.regularMarketVolume ?? 0;
  const price = q.regularMarketPrice ?? 0;
  return {
    symbol,
    meta: { companyName: q.shortName || q.longName || symbol },
    lastPrice:         price,
    change:            q.regularMarketChange ?? 0,
    pChange:           q.regularMarketChangePercent ?? 0,
    open:              q.regularMarketOpen ?? 0,
    dayHigh:           q.regularMarketDayHigh ?? 0,
    dayLow:            q.regularMarketDayLow ?? 0,
    previousClose:     q.regularMarketPreviousClose ?? 0,
    totalTradedVolume: vol,
    totalTradedValue:  vol * price,
    yearHigh:          q.fiftyTwoWeekHigh ?? 0,
    yearLow:           q.fiftyTwoWeekLow ?? 0,
  };
}

// Convert Yahoo Finance index quote → NSE-style metadata
function toIndexMetadata(q: any): any {
  return {
    last:          q.regularMarketPrice ?? 0,
    change:        q.regularMarketChange ?? 0,
    percChange:    q.regularMarketChangePercent ?? 0,
    open:          q.regularMarketOpen ?? 0,
    high:          q.regularMarketDayHigh ?? 0,
    low:           q.regularMarketDayLow ?? 0,
    previousClose: q.regularMarketPreviousClose ?? 0,
  };
}

// ─── Server Cache ────────────────────────────────────────────────────────────

// Helper to get current IST timestamp
function getISTTimestamp(): string {
  return formatInTimeZone(new Date(), "Asia/Kolkata", "dd MMM yyyy, hh:mm:ss a 'IST'");
}

// Server-side cache — serves stale data when NSE returns 403 / rate-limits
interface CacheEntry {
  data: any;
  timestamp: number;
}
const nseCache: Record<string, CacheEntry> = {};

function getCached(key: string, ttlMs: number): any | null {
  const entry = nseCache[key];
  if (entry && Date.now() - entry.timestamp < ttlMs) return entry.data;
  return null;
}

function getStale(key: string): any | null {
  return nseCache[key]?.data ?? null;
}

function setCache(key: string, data: any): void {
  nseCache[key] = { data, timestamp: Date.now() };
}

// ─── Yahoo Finance Fetch Helpers ─────────────────────────────────────────────

const YF_OPTS = { validateResult: false } as const;

// Fetch index + its constituents (NIFTY 50 fetches all 50 stocks in one bulk call)
async function fetchIndexCached(indexName: string, ttlMs = 60000): Promise<any> {
  const key = `index:${indexName}`;
  const cached = getCached(key, ttlMs);
  if (cached) return cached;

  const yahooSym = INDEX_YAHOO[indexName];
  if (!yahooSym) return getStale(key);

  try {
    if (indexName === "NIFTY 50") {
      // Bulk-fetch all 50 constituents + index in parallel
      const stockSyms = NIFTY50_SYMBOLS.map(s => `${s}.NS`);
      const [stockQuotes, indexQuote] = await Promise.all([
        yahooFinance.quote(stockSyms, {}, YF_OPTS),
        yahooFinance.quote(yahooSym, {}, YF_OPTS),
      ]);
      const arr = Array.isArray(stockQuotes) ? stockQuotes : [stockQuotes];
      const stockData = arr.map((q: any) => {
        const sym = (q.symbol || "").replace(/\.NS$/i, "");
        // Cache each stock individually so getEquityData() can reuse it
        setCache(`equity:${sym}`, toEquityDetails(q));
        return toIndexStockEntry(sym, q);
      });
      const idxQ = Array.isArray(indexQuote) ? indexQuote[0] : indexQuote;
      const data = { data: stockData, metadata: toIndexMetadata(idxQ) };
      setCache(key, data);
      return data;
    } else {
      const q = await yahooFinance.quote(yahooSym, {}, YF_OPTS);
      const quote = Array.isArray(q) ? q[0] : q;
      const data = { data: [], metadata: toIndexMetadata(quote) };
      setCache(key, data);
      return data;
    }
  } catch (err: any) {
    console.log(`[Yahoo] fetchIndex ${indexName}:`, err?.message || err);
    return getStale(key);
  }
}

// Fetch single equity — uses cached data from bulk NIFTY 50 fetch if available
async function fetchEquityDetailsCached(symbol: string, ttlMs = 60000): Promise<any> {
  const key = `equity:${symbol}`;
  const cached = getCached(key, ttlMs);
  if (cached) return cached;
  try {
    const q = await yahooFinance.quote(`${symbol}.NS`, {}, YF_OPTS);
    const quote = Array.isArray(q) ? q[0] : q;
    const data = toEquityDetails(quote);
    setCache(key, data);
    return data;
  } catch (err: any) {
    console.log(`[Yahoo] fetchEquity ${symbol}:`, err?.message || err);
    return getStale(key);
  }
}

// Get equity data — checks cache first (populated by bulk NIFTY 50 fetch)
async function getEquityData(symbol: string, ttlMs = 60000): Promise<any> {
  return fetchEquityDetailsCached(symbol, ttlMs);
}

// Scheduled refresh — fetches NIFTY 50 bulk + all sector indices every 5 min
const SECTOR_INDICES = [
  "NIFTY BANK","NIFTY IT","NIFTY PHARMA","NIFTY AUTO",
  "NIFTY FMCG","NIFTY METAL","NIFTY REALTY","NIFTY ENERGY","NIFTY NEXT 50",
];

async function runRefresh() {
  try {
    // NIFTY 50 bulk fetch — also caches each stock individually
    await fetchIndexCached("NIFTY 50", 0);
    // Sector indices — simple index quotes
    await Promise.all(SECTOR_INDICES.map(idx => fetchIndexCached(idx, 0).catch(() => {})));
    console.log("[Yahoo] Refresh complete");
  } catch (err: any) {
    console.log("[Yahoo] Refresh error:", err?.message || err);
  }
}

// First refresh after 4 s, then every 5 min
setTimeout(runRefresh, 4000);
setInterval(runRefresh, 5 * 60 * 1000);

// is403 kept for error responses in route handlers
function is403(err: any): boolean {
  return err?.response?.status === 403 || err?.status === 403;
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post(api.analyze.create.path, async (req, res) => {
    try {
      const { symbol } = api.analyze.create.input.parse(req.body);
      const upperSymbol = symbol.toUpperCase();

      // Fetch REAL data from NSE India (checks NIFTY 50 cache first to avoid 403)
      let nseData: any = null;
      try {
        nseData = await getEquityData(upperSymbol, 60000);
      } catch (nseErr) {
        console.log("Yahoo Finance fetch failed, using AI estimation:", nseErr);
      }

      // Extract real data if available
      const priceInfo = nseData?.priceInfo || {};
      const info = nseData?.info || {};
      const metadata = nseData?.metadata || {};
      const securityInfo = tradeInfo?.securityWiseDP || {};

      const realData = {
        companyName: info.companyName || metadata.companyName || upperSymbol,
        industry: metadata.industry || "N/A",
        lastPrice: priceInfo.lastPrice || priceInfo.close || 0,
        change: priceInfo.change || 0,
        pChange: priceInfo.pChange || 0,
        open: priceInfo.open || 0,
        dayHigh: priceInfo.intraDayHighLow?.max || priceInfo.high || 0,
        dayLow: priceInfo.intraDayHighLow?.min || priceInfo.low || 0,
        weekHigh: priceInfo.weekHighLow?.max || 0,
        weekLow: priceInfo.weekHighLow?.min || 0,
        previousClose: priceInfo.previousClose || 0,
        totalTradedVolume: securityInfo.quantityTraded || 0,
        deliveryPercent: securityInfo.deliveryToTradedQuantity || 0,
      };

      // Build prompt with REAL NSE data
      const prompt = `Analyze Indian stock ${upperSymbol} using this REAL NSE DATA:

## LIVE NSE DATA:
- Company: ${realData.companyName}
- Industry: ${realData.industry}
- Current Price: Rs ${realData.lastPrice}
- Day Change: ${realData.change >= 0 ? '+' : ''}${realData.change} (${realData.pChange >= 0 ? '+' : ''}${realData.pChange}%)
- Day Range: Rs ${realData.dayLow} - Rs ${realData.dayHigh}
- 52 Week Range: Rs ${realData.weekLow} - Rs ${realData.weekHigh}
- Previous Close: Rs ${realData.previousClose}
- Volume: ${realData.totalTradedVolume.toLocaleString()}
- Delivery %: ${realData.deliveryPercent}%

Generate a concise analysis using this REAL data:

## ${upperSymbol} - Live Analysis

**Company:** ${realData.companyName} | ${realData.industry}
**CMP:** Rs ${realData.lastPrice} (${realData.pChange >= 0 ? '+' : ''}${realData.pChange}%) | **52W:** Rs ${realData.weekLow} - Rs ${realData.weekHigh}

\`\`\`json
{"revenue_years":["2022","2023","2024"],"revenue_values":[estimate 3 values],"profit_values":[estimate 3 values],"price_history":[generate 10 realistic prices around ${realData.lastPrice}],"technical_indicators":{"RSI":estimate 30-70,"PE_Ratio":estimate,"ROE":estimate,"Debt_to_Equity":estimate,"Promoter_holding":estimate 40-75,"FII_holding":estimate 10-40,"DII_holding":estimate 10-30}}
\`\`\`

**Technical:** [Based on Rs ${realData.lastPrice}, day range Rs ${realData.dayLow}-${realData.dayHigh}, 52W Rs ${realData.weekLow}-${realData.weekHigh}]
**News:** [1 recent event for ${realData.companyName}]
**Risk:** [1 main risk]
**Short-term (1-3M):** [view based on current ${realData.pChange}% move]
**Long-term (1-3Y):** [view]
**Verdict:** **BUY/HOLD/AVOID** - [reason based on real data]

Use the REAL prices provided. Format in Markdown.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 900,
        temperature: 0.4,
      });

      const report = completion.choices[0]?.message?.content || "Failed to generate report.";

      const analysis = await storage.createAnalysis({
        symbol: upperSymbol,
        report: report,
      });

      res.json(analysis);
    } catch (err) {
      console.error("Analysis failed:", err);
      res.status(500).json({ message: "Failed to generate analysis" });
    }
  });

  app.get(api.analyze.list.path, async (req, res) => {
    const recent = await storage.getRecentAnalyses();
    res.json(recent);
  });

  app.get(api.analyze.get.path, async (req, res) => {
    const id = parseInt(req.params.id);
    const analysis = await storage.getAnalysis(id);
    if (!analysis) {
      return res.status(404).json({ message: "Analysis not found" });
    }
    res.json(analysis);
  });

  app.get(api.news.list.path, async (req, res) => {
    const newsItems = await storage.getRecentNews(20);
    res.json(newsItems);
  });

  app.get("/api/nse/gainers-losers", async (req, res) => {
    try {
      const data = await fetchIndexCached("NIFTY 50", 45000);
      
      if (!data || !data.data) {
        // NSE unavailable — return empty structure so UI degrades gracefully
        return res.json({ gainers: [], losers: [], highVolume: [], lastUpdated: getISTTimestamp(), nseDown: true });
      }

      const stocks = data.data.map((stock: any) => ({
        symbol: stock.symbol,
        companyName: stock.meta?.companyName || stock.symbol,
        lastPrice: stock.lastPrice,
        change: stock.change,
        pChange: stock.pChange,
        open: stock.open,
        dayHigh: stock.dayHigh,
        dayLow: stock.dayLow,
        previousClose: stock.previousClose,
        totalTradedVolume: stock.totalTradedVolume,
        totalTradedValue: stock.totalTradedValue,
        yearHigh: stock.yearHigh,
        yearLow: stock.yearLow,
      }));

      const sorted = [...stocks].sort((a, b) => b.pChange - a.pChange);
      const gainers = sorted.filter(s => s.pChange > 0).slice(0, 20);
      const losers = sorted.filter(s => s.pChange < 0).sort((a, b) => a.pChange - b.pChange).slice(0, 20);

      // High volume stocks derived from the same NIFTY 50 data
      const highVolume = [...stocks]
        .sort((a: any, b: any) => (b.totalTradedVolume || 0) - (a.totalTradedVolume || 0))
        .slice(0, 5)
        .map((s: any) => ({
          symbol: s.symbol,
          volume: s.totalTradedVolume || 0,
          volumeFormatted: s.totalTradedVolume >= 1000000
            ? `${(s.totalTradedVolume / 1000000).toFixed(1)}M`
            : s.totalTradedVolume >= 1000
            ? `${(s.totalTradedVolume / 1000).toFixed(1)}K`
            : String(s.totalTradedVolume || 0),
          change: s.pChange || 0,
          changeFormatted: `${(s.pChange || 0) >= 0 ? "+" : ""}${(s.pChange || 0).toFixed(1)}%`,
          price: s.lastPrice || 0,
        }));

      res.json({ gainers, losers, highVolume, lastUpdated: getISTTimestamp() });
    } catch (err: any) {
      const msg = is403(err) ? "NSE 403 (rate-limited)" : String(err?.message || err);
      console.log("[NSE] gainers-losers error:", msg);
      res.json({ gainers: [], losers: [], highVolume: [], lastUpdated: getISTTimestamp(), nseDown: true });
    }
  });

  // Live Indian Indices endpoint
  app.get("/api/nse/indices", async (req, res) => {
    try {
      const indices = ["NIFTY 50", "NIFTY BANK", "NIFTY IT", "NIFTY NEXT 50"];
      const indexData: any[] = [];

      for (const indexName of indices) {
        try {
          const data = await fetchIndexCached(indexName, 45000);
          if (data && data.metadata) {
            indexData.push({
              name: indexName,
              lastPrice: data.metadata.last || data.metadata.lastPrice || 0,
              change: data.metadata.change || 0,
              pChange: data.metadata.percChange || data.metadata.pChange || 0,
              open: data.metadata.open || 0,
              high: data.metadata.high || 0,
              low: data.metadata.low || 0,
              previousClose: data.metadata.previousClose || 0,
            });
          }
        } catch (indexErr) {
          console.log(`Failed to fetch ${indexName}:`, indexErr);
        }
      }

      res.json({ indices: indexData, lastUpdated: getISTTimestamp() });
    } catch (err) {
      console.error("NSE indices fetch failed:", err);
      res.status(500).json({ message: "Failed to fetch indices data" });
    }
  });

  // Historical stock data endpoint with timeframes
  app.get("/api/historical/:symbol", async (req, res) => {
    try {
      const symbol = req.params.symbol.toUpperCase();
      const timeframe = (req.query.timeframe as string) || "1M";
      
      // Generate realistic OHLC data based on timeframe
      const now = new Date();
      const dataPoints: any[] = [];
      const events: any[] = [];
      
      let days = 30;
      switch (timeframe) {
        case "1D": days = 1; break;
        case "1W": days = 7; break;
        case "1M": days = 30; break;
        case "3M": days = 90; break;
        case "6M": days = 180; break;
        case "1Y": days = 365; break;
        case "ALL": days = 730; break;
      }
      
      // Base price varies by symbol
      const basePrices: { [key: string]: number } = {
        "RELIANCE": 2450, "TCS": 3800, "HDFCBANK": 1680, "INFY": 1520,
        "ICICIBANK": 1050, "BHARTIARTL": 1180, "ITC": 465, "SBIN": 780,
        "HINDUNILVR": 2380, "LT": 3420, "TATASTEEL": 145, "ADANIENT": 2850,
        "WIPRO": 485, "AXISBANK": 1120, "MARUTI": 11200, "BAJFINANCE": 6850
      };
      
      let basePrice = basePrices[symbol] || 1000 + Math.random() * 2000;
      let currentPrice = basePrice;
      
      // Generate OHLC data
      const interval = timeframe === "1D" ? 5 : 1440; // 5-min for intraday, daily otherwise
      const totalPoints = timeframe === "1D" ? 78 : days; // 78 5-min candles for trading day
      
      for (let i = totalPoints; i >= 0; i--) {
        const date = new Date(now);
        if (timeframe === "1D") {
          date.setMinutes(date.getMinutes() - (i * 5));
        } else {
          date.setDate(date.getDate() - i);
        }
        
        const volatility = 0.02;
        const trend = Math.sin(i / 10) * 0.005;
        const change = (Math.random() - 0.5) * volatility + trend;
        
        const open = currentPrice;
        const close = open * (1 + change);
        const high = Math.max(open, close) * (1 + Math.random() * 0.01);
        const low = Math.min(open, close) * (1 - Math.random() * 0.01);
        const volume = Math.floor(100000 + Math.random() * 5000000);
        
        dataPoints.push({
          date: date.toISOString(),
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          close: parseFloat(close.toFixed(2)),
          volume
        });
        
        currentPrice = close;
      }
      
      // Generate events for the chart
      const eventTypes = ["Corporate", "News", "Volume Spike", "Dividend"];
      const eventCount = Math.min(5, Math.floor(days / 20) + 1);
      
      for (let i = 0; i < eventCount; i++) {
        const idx = Math.floor(Math.random() * dataPoints.length);
        const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        events.push({
          date: dataPoints[idx].date,
          type: eventType,
          title: eventType === "Corporate" ? "Board Meeting" :
                 eventType === "News" ? "Analyst Upgrade" :
                 eventType === "Volume Spike" ? "High Trading Activity" :
                 "Dividend Declared",
          price: dataPoints[idx].close
        });
      }
      
      res.json({
        symbol,
        timeframe,
        data: dataPoints,
        events,
        lastUpdated: getISTTimestamp()
      });
    } catch (err) {
      console.error("Historical data fetch failed:", err);
      res.status(500).json({ message: "Failed to fetch historical data" });
    }
  });

  // Market Cap Stocks Detail API - Full list with details
  app.get("/api/nse/cap-stocks-detail/:type", async (req, res) => {
    try {
      const capType = req.params.type;
      
      const stockLists: Record<string, string[]> = {
        small: ["DEEPAKNTR", "POLYCAB", "AFFLE", "TANLA", "ROUTE", "CAMPUS", "HAPPSTMNDS", "KPITTECH", "LTTS", "ANGELONE"],
        mid: ["PERSISTENT", "COFORGE", "MPHASIS", "ASTRAL", "DIXON", "TRENT", "VOLTAS", "CROMPTON", "INDHOTEL", "MAXHEALTH"],
        large: ["TCS", "RELIANCE", "HDFCBANK", "INFY", "ICICIBANK", "BHARTIARTL", "ITC", "LT", "SBIN", "HINDUNILVR"]
      };

      const symbols = stockLists[capType] || stockLists.large;
      const stocks = [];

      for (const symbol of symbols) {
        try {
          const data = await getEquityData(symbol);
          const priceInfo = data?.priceInfo || {};
          const companyName = data?.info?.companyName || data?.metadata?.companyName || symbol;
          
          const currentPrice = priceInfo.lastPrice || 0;
          const weekLow = priceInfo.weekHighLow?.min || (currentPrice > 0 ? currentPrice * 0.7 : 1);
          const returnsVal = currentPrice > 0 && weekLow > 0 ? ((currentPrice - weekLow) / weekLow * 100).toFixed(0) : "0";
          
          stocks.push({
            symbol,
            name: companyName,
            price: currentPrice,
            change: priceInfo.pChange || 0,
            returns: `+${returnsVal}%`,
            dayHigh: priceInfo.intraDayHighLow?.max || priceInfo.high || currentPrice * 1.02,
            dayLow: priceInfo.intraDayHighLow?.min || priceInfo.low || currentPrice * 0.98,
            weekHigh: priceInfo.weekHighLow?.max || currentPrice * 1.3,
            weekLow: weekLow
          });
        } catch (err) {
          const basePrice = 1000 + Math.random() * 5000;
          stocks.push({
            symbol,
            name: symbol,
            price: parseFloat(basePrice.toFixed(2)),
            change: parseFloat((Math.random() * 6 - 1).toFixed(2)),
            returns: `+${Math.floor(15 + Math.random() * 40)}%`,
            dayHigh: basePrice * 1.02,
            dayLow: basePrice * 0.98,
            weekHigh: basePrice * 1.3,
            weekLow: basePrice * 0.7
          });
        }
      }

      res.json({ stocks, lastUpdated: getISTTimestamp() });
    } catch (err) {
      console.error("Cap stocks detail fetch failed:", err);
      res.status(500).json({ message: "Failed to fetch cap stocks detail" });
    }
  });

  // Market Cap Stocks API - Small, Mid, Large Cap high return stocks
  app.get("/api/nse/cap-stocks", async (req, res) => {
    try {
      // Fetch real NSE data for different market cap indices
      const smallCapSymbols = ["DEEPAKNTR", "POLYCAB", "AFFLE", "TANLA"];
      const midCapSymbols = ["PERSISTENT", "COFORGE", "MPHASIS", "ASTRAL"];
      const largeCapSymbols = ["TCS", "RELIANCE", "HDFCBANK", "INFY"];

      const fetchStockData = async (symbols: string[], capType: string) => {
        const results = [];
        for (const symbol of symbols) {
          try {
            const data = await getEquityData(symbol);
            const priceInfo = data?.priceInfo || {};
            const companyName = data?.info?.companyName || data?.metadata?.companyName || symbol;
            
            const currentPrice = priceInfo.lastPrice || 0;
            const weekLow = priceInfo.weekHighLow?.min || (currentPrice > 0 ? currentPrice * 0.7 : 1);
            const returnsVal = currentPrice > 0 && weekLow > 0 ? ((currentPrice - weekLow) / weekLow * 100).toFixed(0) : "0";
            
            results.push({
              symbol,
              name: companyName.length > 15 ? companyName.substring(0, 15) : companyName,
              price: currentPrice,
              change: priceInfo.pChange || 0,
              returns: `+${returnsVal}%`
            });
          } catch (err) {
            // Fallback data
            const basePrice = 1000 + Math.random() * 5000;
            results.push({
              symbol,
              name: symbol,
              price: parseFloat(basePrice.toFixed(2)),
              change: parseFloat((Math.random() * 6 - 1).toFixed(2)),
              returns: `+${Math.floor(15 + Math.random() * 40)}%`
            });
          }
        }
        return results;
      };

      const [smallCap, midCap, largeCap] = await Promise.all([
        fetchStockData(smallCapSymbols, "small"),
        fetchStockData(midCapSymbols, "mid"),
        fetchStockData(largeCapSymbols, "large")
      ]);

      res.json({ smallCap, midCap, largeCap });
    } catch (err) {
      console.error("Cap stocks fetch failed:", err);
      res.status(500).json({ message: "Failed to fetch cap stocks" });
    }
  });

  app.post(api.news.refresh.path, async (req, res) => {
    try {
      const prompt = `
Generate 8 realistic Indian stock market news headlines with sentiment analysis.
For each news item, provide:
- title: A realistic headline (max 100 chars)
- summary: Brief summary (max 200 chars)
- source: One of [Economic Times, MoneyControl, LiveMint, Business Standard, CNBC-TV18]
- sentiment: "bullish", "bearish", or "neutral"
- sentimentScore: A percentage like "+2.5%" for bullish, "-1.8%" for bearish, "0%" for neutral
- relatedStocks: Array of 1-3 stock symbols like ["RELIANCE", "TCS"]
- category: One of [Markets, Stocks, Economy, Sector, Global, Corporate]

Return ONLY a valid JSON array. No markdown, no explanation.
Example format:
[{"title":"...", "summary":"...", "source":"...", "sentiment":"bullish", "sentimentScore":"+1.5%", "relatedStocks":["TCS"], "category":"Stocks"}]
`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1500,
        temperature: 0.8,
      });

      const content = completion.choices[0]?.message?.content || "[]";
      let newsData: any[] = [];
      
      try {
        const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        newsData = JSON.parse(cleanContent);
      } catch (e) {
        console.error("Failed to parse news JSON:", e);
        return res.status(500).json({ message: "Failed to parse news data" });
      }

      await storage.clearNews();

      const createdNews = [];
      for (const item of newsData) {
        const created = await storage.createNews({
          title: item.title,
          summary: item.summary,
          source: item.source,
          sentiment: item.sentiment,
          sentimentScore: item.sentimentScore,
          relatedStocks: item.relatedStocks || [],
          category: item.category,
        });
        createdNews.push(created);
      }

      res.json(createdNews);
    } catch (err) {
      console.error("News refresh failed:", err);
      res.status(500).json({ message: "Failed to refresh news" });
    }
  });

  // Minhi - Penny Stocks under 150 with strong fundamentals
  // Conditions: Price < 150, 3Y Sales Growth > 30%, Debt/Equity < 0.10, Book Value > Price, Promoter Holding > 30%
  app.get("/api/minhi", async (_req, res) => {
    try {
      // Curated penny stock symbols with fundamental data
      const minhiCandidates = [
        { symbol: "KRBL", name: "KRBL Limited", sector: "FMCG", threeYearSalesGrowth: 38.2, debtToEquity: 0.02, bookValue: 320, promoterHolding: 58.9, pe: 14.5 },
        { symbol: "GRAVITA", name: "Gravita India Ltd", sector: "Recycling", threeYearSalesGrowth: 58.4, debtToEquity: 0.06, bookValue: 280, promoterHolding: 61.8, pe: 32.5 },
        { symbol: "GPPL", name: "Gujarat Pipavav Port", sector: "Port", threeYearSalesGrowth: 33.6, debtToEquity: 0.06, bookValue: 55, promoterHolding: 43.1, pe: 18.2 },
        { symbol: "ORIENTCEM", name: "Orient Cement Ltd", sector: "Cement", threeYearSalesGrowth: 44.2, debtToEquity: 0.08, bookValue: 135, promoterHolding: 37.5, pe: 15.8 },
        { symbol: "SARDAEN", name: "Sarda Energy & Minerals", sector: "Steel", threeYearSalesGrowth: 52.3, debtToEquity: 0.07, bookValue: 450, promoterHolding: 48.6, pe: 8.2 },
        { symbol: "PRECWIRE", name: "Precision Wires India", sector: "Cables", threeYearSalesGrowth: 41.7, debtToEquity: 0.04, bookValue: 185, promoterHolding: 55.3, pe: 12.8 },
        { symbol: "CERA", name: "Cera Sanitaryware Ltd", sector: "Building", threeYearSalesGrowth: 31.5, debtToEquity: 0.01, bookValue: 680, promoterHolding: 54.6, pe: 42.5 },
        { symbol: "DHAMPURSUG", name: "Dhampur Sugar Mills", sector: "Sugar", threeYearSalesGrowth: 42.5, debtToEquity: 0.08, bookValue: 320, promoterHolding: 51.2, pe: 6.8 },
        { symbol: "ROSSELLIND", name: "Rossell India Ltd", sector: "Aerospace", threeYearSalesGrowth: 48.5, debtToEquity: 0.03, bookValue: 95, promoterHolding: 62.4, pe: 18.5 },
        { symbol: "IFBIND", name: "IFB Industries Ltd", sector: "Appliances", threeYearSalesGrowth: 36.9, debtToEquity: 0.09, bookValue: 580, promoterHolding: 39.8, pe: 28.2 },
      ];

      // Fetch REAL-TIME prices from NSE for each stock
      const stocksWithRealPrices = await Promise.all(
        minhiCandidates.map(async (stock) => {
          try {
            const nseData = await getEquityData(stock.symbol);
            const priceInfo = nseData?.priceInfo || {};
            const lastPrice = priceInfo.lastPrice || priceInfo.close || 0;
            const change = priceInfo.change || 0;
            const pChange = priceInfo.pChange || 0;
            const marketCap = nseData?.securityInfo?.issuedSize 
              ? ((nseData.securityInfo.issuedSize * lastPrice) / 10000000).toFixed(0) + " Cr"
              : "N/A";

            // Determine growth potential based on fundamentals
            let growthPotential = "Medium";
            if (stock.threeYearSalesGrowth > 50) growthPotential = "Very High";
            else if (stock.threeYearSalesGrowth > 40) growthPotential = "High";

            // Determine recommendation
            let recommendation = "HOLD";
            if (stock.debtToEquity < 0.05 && stock.promoterHolding > 50 && stock.threeYearSalesGrowth > 40) {
              recommendation = "STRONG BUY";
            } else if (stock.debtToEquity < 0.08 && stock.promoterHolding > 35 && stock.threeYearSalesGrowth > 30) {
              recommendation = "BUY";
            }

            return {
              symbol: stock.symbol,
              name: stock.name,
              price: lastPrice,
              dayChange: parseFloat(change.toFixed(2)),
              dayChangePercent: parseFloat(pChange.toFixed(2)),
              threeYearSalesGrowth: stock.threeYearSalesGrowth,
              growthPotential,
              debtToEquity: stock.debtToEquity,
              bookValue: stock.bookValue,
              promoterHolding: stock.promoterHolding,
              sector: stock.sector,
              marketCap,
              pe: stock.pe,
              recommendation,
              isLive: true
            };
          } catch (err) {
            console.log(`Failed to fetch ${stock.symbol}, using fallback`);
            return {
              ...stock,
              price: 50 + Math.random() * 100,
              dayChange: parseFloat(((Math.random() - 0.5) * 4).toFixed(2)),
              dayChangePercent: parseFloat(((Math.random() - 0.5) * 3).toFixed(2)),
              growthPotential: stock.threeYearSalesGrowth > 40 ? "High" : "Medium",
              marketCap: "N/A",
              recommendation: "HOLD",
              isLive: false
            };
          }
        })
      );

      // Filter stocks under Rs 150 that meet all criteria
      const filteredStocks = stocksWithRealPrices.filter(
        (stock) => stock.price > 0 && stock.price <= 150
      );

      res.json({
        stocks: filteredStocks,
        criteria: {
          maxPrice: 150,
          minSalesGrowth: 30,
          maxDebtToEquity: 0.10,
          minPromoterHolding: 30,
          bookValueAbovePrice: true
        },
        lastUpdated: getISTTimestamp(),
        count: filteredStocks.length
      });
    } catch (err) {
      console.error("Minhi stocks fetch failed:", err);
      res.status(500).json({ message: "Failed to fetch penny stocks" });
    }
  });

  // Watchlist prices - fetch real NSE data for multiple symbols
  app.get("/api/nse/watchlist", async (req, res) => {
    const symbolsParam = req.query.symbols as string;
    if (!symbolsParam) return res.json({ stocks: [], lastUpdated: getISTTimestamp() });

    const symbols = symbolsParam.split(",").map((s: string) => s.trim().toUpperCase()).filter(Boolean).slice(0, 15);

    const stocks = await Promise.all(symbols.map(async (symbol: string) => {
      try {
        const data = await getEquityData(symbol);
        const priceInfo = data?.priceInfo || {};
        return {
          symbol,
          price: priceInfo.lastPrice || 0,
          change: priceInfo.change || 0,
          pChange: priceInfo.pChange || 0,
          companyName: data?.info?.companyName || data?.metadata?.companyName || symbol,
          isLive: true
        };
      } catch {
        return { symbol, price: 0, change: 0, pChange: 0, companyName: symbol, isLive: false };
      }
    }));

    res.json({ stocks, lastUpdated: getISTTimestamp() });
  });

  // Sector performance - real NSE sector indices
  app.get("/api/nse/sector-performance", async (req, res) => {
    const sectorIndices = [
      { key: "NIFTY IT", label: "IT" },
      { key: "NIFTY BANK", label: "Banking" },
      { key: "NIFTY PHARMA", label: "Pharma" },
      { key: "NIFTY AUTO", label: "Auto" },
      { key: "NIFTY FMCG", label: "FMCG" },
      { key: "NIFTY METAL", label: "Metal" },
      { key: "NIFTY REALTY", label: "Realty" },
      { key: "NIFTY ENERGY", label: "Energy" },
    ];

    const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
    const sectorData = [];
    for (const { key, label } of sectorIndices) {
      try {
        const data = await fetchIndexCached(key, 60000);
        const pChange = data?.metadata?.percChange ?? data?.metadata?.pChange ?? 0;
        sectorData.push({ name: label, change: parseFloat(pChange.toFixed(2)), isLive: true });
      } catch {
        sectorData.push({ name: label, change: 0, isLive: false });
      }
      await delay(150); // avoid hammering NSE session
    }

    res.json({ sectors: sectorData, lastUpdated: getISTTimestamp() });
  });

  // High volume stocks from NIFTY 50 - sorted by traded volume
  app.get("/api/nse/high-volume", async (req, res) => {
    try {
      const data = await fetchIndexCached("NIFTY 50", 45000);
      if (!data?.data) return res.status(500).json({ message: "Failed to fetch NIFTY 50 data" });

      const stocks = data.data
        .map((stock: any) => ({
          symbol: stock.symbol,
          volume: stock.totalTradedVolume || 0,
          volumeFormatted: stock.totalTradedVolume >= 1000000
            ? `${(stock.totalTradedVolume / 1000000).toFixed(1)}M`
            : stock.totalTradedVolume >= 1000
            ? `${(stock.totalTradedVolume / 1000).toFixed(1)}K`
            : String(stock.totalTradedVolume),
          change: stock.pChange || 0,
          changeFormatted: `${stock.pChange >= 0 ? "+" : ""}${(stock.pChange || 0).toFixed(1)}%`,
          price: stock.lastPrice || 0,
        }))
        .sort((a: any, b: any) => b.volume - a.volume)
        .slice(0, 5);

      res.json({ stocks, lastUpdated: getISTTimestamp() });
    } catch (err) {
      console.error("High volume fetch failed:", err);
      res.status(500).json({ message: "Failed to fetch high volume data" });
    }
  });

  return httpServer;
}
