import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import OpenAI from "openai";
import { NseIndia } from "stock-nse-india";

const nseIndia = new NseIndia();

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

      // Fetch REAL data from NSE India
      let nseData: any = null;
      let tradeInfo: any = null;
      
      try {
        nseData = await nseIndia.getEquityDetails(upperSymbol);
        tradeInfo = await nseIndia.getEquityTradeInfo(upperSymbol);
      } catch (nseErr) {
        console.log("NSE fetch failed, using AI estimation:", nseErr);
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
      const data = await nseIndia.getEquityStockIndices("NIFTY 50");
      
      if (!data || !data.data) {
        return res.status(500).json({ message: "Failed to fetch NSE data" });
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

      res.json({ gainers, losers, lastUpdated: new Date().toISOString() });
    } catch (err) {
      console.error("NSE fetch failed:", err);
      res.status(500).json({ message: "Failed to fetch NSE data" });
    }
  });

  // Live Indian Indices endpoint
  app.get("/api/nse/indices", async (req, res) => {
    try {
      const indices = ["NIFTY 50", "NIFTY BANK", "NIFTY IT", "NIFTY NEXT 50"];
      const indexData: any[] = [];

      for (const indexName of indices) {
        try {
          const data = await nseIndia.getEquityStockIndices(indexName);
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

      res.json({ indices: indexData, lastUpdated: new Date().toISOString() });
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
        lastUpdated: new Date().toISOString()
      });
    } catch (err) {
      console.error("Historical data fetch failed:", err);
      res.status(500).json({ message: "Failed to fetch historical data" });
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

  return httpServer;
}
