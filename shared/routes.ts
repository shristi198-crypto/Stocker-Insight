import { z } from 'zod';
import { insertAnalysisSchema, analyses, news } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const newsItemSchema = z.object({
  id: z.number(),
  title: z.string(),
  summary: z.string(),
  source: z.string(),
  sentiment: z.enum(['bullish', 'bearish', 'neutral']),
  sentimentScore: z.string(),
  relatedStocks: z.array(z.string()).nullable(),
  category: z.string(),
  createdAt: z.string().nullable(),
});

export const api = {
  analyze: {
    create: {
      method: 'POST' as const,
      path: '/api/analyze',
      input: z.object({
        symbol: z.string().min(1).max(20),
      }),
      responses: {
        200: z.custom<typeof analyses.$inferSelect>(),
        500: errorSchemas.internal,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/analyses',
      responses: {
        200: z.array(z.custom<typeof analyses.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/analyses/:id',
      responses: {
        200: z.custom<typeof analyses.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  news: {
    list: {
      method: 'GET' as const,
      path: '/api/news',
      responses: {
        200: z.array(newsItemSchema),
      },
    },
    refresh: {
      method: 'POST' as const,
      path: '/api/news/refresh',
      responses: {
        200: z.array(newsItemSchema),
        500: errorSchemas.internal,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
