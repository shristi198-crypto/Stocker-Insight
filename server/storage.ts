import { db } from "./db";
import { analyses, news, type InsertAnalysis, type Analysis, type InsertNews, type News } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  createAnalysis(analysis: InsertAnalysis): Promise<Analysis>;
  getAnalysis(id: number): Promise<Analysis | undefined>;
  getRecentAnalyses(limit?: number): Promise<Analysis[]>;
  createNews(newsItem: InsertNews): Promise<News>;
  getRecentNews(limit?: number): Promise<News[]>;
  clearNews(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async createAnalysis(analysis: InsertAnalysis): Promise<Analysis> {
    const [created] = await db.insert(analyses).values(analysis).returning();
    return created;
  }

  async getAnalysis(id: number): Promise<Analysis | undefined> {
    const [analysis] = await db.select().from(analyses).where(eq(analyses.id, id));
    return analysis;
  }

  async getRecentAnalyses(limit: number = 10): Promise<Analysis[]> {
    return await db.select().from(analyses).orderBy(desc(analyses.createdAt)).limit(limit);
  }

  async createNews(newsItem: InsertNews): Promise<News> {
    const [created] = await db.insert(news).values(newsItem).returning();
    return created;
  }

  async getRecentNews(limit: number = 10): Promise<News[]> {
    return await db.select().from(news).orderBy(desc(news.createdAt)).limit(limit);
  }

  async clearNews(): Promise<void> {
    await db.delete(news);
  }
}

export const storage = new DatabaseStorage();
