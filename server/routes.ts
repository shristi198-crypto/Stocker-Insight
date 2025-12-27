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

  return httpServer;
}
