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
Act as a professional Stock Market Analyst for the Indian and global markets.
Analyze the stock: ${symbol}
Market: Indian Stock Market (NSE/BSE) and global market references if applicable.

Provide a detailed analysis using NUMBERS, FIGURES, and patterns suitable for GRAPHICAL representation.

Structure the response as follows:

1. Company Overview: (business model, sector, competitors) - EXACTLY 1 LINE.
2. Current Market Price & Market Capitalization: (Provide current figures)
3. Fundamental Analysis Data (JSON block for charting):
   - Revenue (last 5 years as an array)
   - Profits (last 5 years as an array)
   - EPS & ROE (current figures)
   - Debt to Equity ratio
   - Promoter holding, FII, and DII holding (as percentages)
4. Technical Analysis Indicators:
   - Trend (short-term & long-term)
   - Support & Resistance levels (provide specific price points)
   - RSI (number), MACD (crossover status), Moving Averages (50-day, 200-day)
   - Volume analysis (relative to 30-day average)
5. Final verdict: Buy / Hold / Avoid (with clear reasoning)

Format the majority of the report in Markdown, but ensure numerical data is clearly presented in tables or lists for easy parsing.
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
