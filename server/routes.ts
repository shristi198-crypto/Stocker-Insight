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
Act as a professional Stock Market Analyst.
Analyze the stock: ${symbol}
Market: Indian Stock Market (NSE/BSE)

Provide a detailed analysis covering the following points:

1. Company Overview (business model, sector, competitors)
2. Current Market Price & Market Capitalization (Estimate or mention "as of latest close")
3. Fundamental Analysis:
   - Revenue growth (last 3–5 years)
   - Profit growth
   - EPS & ROE
   - Debt to Equity ratio
   - Promoter holding & FII/DII holding
4. Technical Analysis:
   - Trend (short-term & long-term)
   - Support & Resistance levels
   - RSI, MACD, Moving Averages
   - Volume analysis
5. Recent News or Events impacting the stock
6. Risk factors involved
7. Short-term view (1–3 months)
8. Long-term view (1–3 years)
9. Final verdict: Buy / Hold / Avoid (with reasoning)

Explain in simple language suitable for a beginner. Format the output in Markdown.
`;

      const completion = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [{ role: "user", content: prompt }],
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
