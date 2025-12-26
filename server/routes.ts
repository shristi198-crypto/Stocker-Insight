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
Act as a professional Financial Analyst specialized in the Indian Stock Market.
Analyze the stock: ${symbol}
Market: Indian Stock Market (NSE/BSE)

You MUST provide precise financial numbers as found on professional platforms like Screener.in.

Provide a detailed analysis covering:

1. Company Overview (business model, sector, competitors) - EXACTLY 1 LINE.
2. Market Snapshot: (Current Market Price & Market Capitalization in Cr, 52-week High/Low)
3. Fundamental Analysis Data (JSON block for charting):
   {
     "Revenue_Growth": [5 years array of numbers representing yearly revenue],
     "Profit_Growth": [3 years array of numbers representing yearly net profit],
     "Price_Trend": [10 data points representing recent price action],
     "Volume": [10 data points representing recent volume],
     "EPS": number (Current Earnings Per Share),
     "ROE": number (Return on Equity percentage),
     "Debt_to_Equity": number (Debt to Equity ratio),
     "Promoter_holding": percentage (Promoter holding),
     "FII_holding": percentage (FII holding),
     "DII_holding": percentage (DII holding),
     "CMP": number (Current Market Price),
     "Market_Cap_Cr": number (Market Cap in Crores),
     "High_52": number (52-week High),
     "Low_52": number (52-week Low),
     "RSI": number,
     "MACD": "string",
     "MA_50": number,
     "MA_200": number,
     "Support": [price1, price2],
     "Resistance": [price1, price2]
   }
4. Technical Analysis: (Trend, Support/Resistance, RSI/MACD/MA details, Volume analysis)
5. Final verdict: Buy / Hold / Avoid (with clear reasoning)

Format the report in Markdown, but ensure the JSON block is CLEARLY marked with \`\`\`json.
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

  return httpServer;
}
