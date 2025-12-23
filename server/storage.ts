import { db } from "./db";
import { analyses, type InsertAnalysis, type Analysis } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  createAnalysis(analysis: InsertAnalysis): Promise<Analysis>;
  getAnalysis(id: number): Promise<Analysis | undefined>;
  getRecentAnalyses(limit?: number): Promise<Analysis[]>;
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
}

export const storage = new DatabaseStorage();
