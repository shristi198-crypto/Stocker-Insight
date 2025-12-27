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

      // Generate analysis using OpenAI
      const prompt = `
Act as a professional Stock Market Analyst specialized in the Indian Stock Market.

Analyze the stock: ${symbol}
Market: Indian Stock Market (NSE/BSE)

Provide a detailed analysis covering the following points:
Using methodologies similar to Seaborn, Numpy, and Pandas for data mining and visualization.
Reference data from Screener.in and NSE.com.

1. Company Overview (business model, sector, competitors) - EXACTLY 2 LINES.
2. Market Snapshot: (Current Market Price & Market Capitalization in Cr, 52-week High/Low).
3. Quantitative Data (JSON block for Plotly charts):
   {
     "revenue_years": ["2020", "2021", "2022", "2023", "2024"],
     "revenue_values": [numbers],
     "profit_values": [numbers],
     "price_history": [10 recent closing prices],
     "technical_indicators": {
       "RSI": number,
       "PE_Ratio": number,
       "ROE": number,
       "Debt_to_Equity": number,
       "Promoter_holding": percentage,
       "FII_holding": percentage,
       "DII_holding": percentage
     }
   }
4. Technical Analysis: (Trend short-term & long-term, Support & Resistance levels, RSI, MACD, Moving Averages, Volume analysis).
5. Highlight Points: [Recent News or Events impacting the stock].
6. Risk factors involved.
7. Short-term view (1-3 months).
8. Long-term view (1-3 years).
9. Final verdict: Buy / Hold / Avoid (with reasoning).

Format the report in Markdown, but ensure the JSON block is CLEARLY marked with \`\`\`json.
Note: Data should reflect the most recent 5-minute interval state if possible.
`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1500,
        temperature: 0.7,
      });

      const report = completion.choices[0]?.message?.content || "Failed to generate report.";

      const analysis = await storage.createAnalysis({
        symbol: symbol.toUpperCase(),
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
