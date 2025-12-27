import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import OpenAI from "openai";

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
