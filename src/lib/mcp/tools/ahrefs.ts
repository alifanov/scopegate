import { z } from 'zod';
import { ahrefsFetch } from '../ahrefs';
import type { ToolDefinition } from './types';

export const ahrefsTools: ToolDefinition[] = [
  // =====================
  // Ahrefs tools
  // =====================
  {
    name: "ahrefs_domain_rating",
    description: "Get domain rating from Ahrefs",
    action: "ahrefs:domain_rating",
    inputSchema: z.object({
      target: z.string(),
      date: z.string().optional(),
    }),
    handler: async (params, context) => {
      const p: Record<string, string> = { target: params.target as string };
      if (params.date) p.date = params.date as string;
      return ahrefsFetch(context.serviceConnectionId, "/site-explorer/domain-rating", p);
    },
  },
  {
    name: "ahrefs_backlinks",
    description: "Get backlinks from Ahrefs",
    action: "ahrefs:backlinks",
    inputSchema: z.object({
      target: z.string(),
      limit: z.number().min(1).max(1000).optional().default(50),
    }),
    handler: async (params, context) => {
      return ahrefsFetch(context.serviceConnectionId, "/site-explorer/all-backlinks", {
        target: params.target as string,
        limit: String(params.limit ?? 50),
        select: "url_from,url_to,ahrefs_rank,domain_rating,anchor,first_seen,last_seen",
      });
    },
  },
  {
    name: "ahrefs_organic_keywords",
    description: "Get organic keywords from Ahrefs",
    action: "ahrefs:organic_keywords",
    inputSchema: z.object({
      target: z.string(),
      country: z.string().optional().default("us"),
      limit: z.number().min(1).max(1000).optional().default(50),
    }),
    handler: async (params, context) => {
      return ahrefsFetch(context.serviceConnectionId, "/site-explorer/organic-keywords", {
        target: params.target as string,
        country: (params.country as string) || "us",
        limit: String(params.limit ?? 50),
        select: "keyword,volume,position,url,traffic,cpc",
      });
    },
  },
  {
    name: "ahrefs_referring_domains",
    description: "Get referring domains from Ahrefs",
    action: "ahrefs:referring_domains",
    inputSchema: z.object({
      target: z.string(),
      limit: z.number().min(1).max(1000).optional().default(50),
    }),
    handler: async (params, context) => {
      return ahrefsFetch(context.serviceConnectionId, "/site-explorer/refdomains", {
        target: params.target as string,
        limit: String(params.limit ?? 50),
        select: "domain,domain_rating,backlinks,first_seen,last_seen",
      });
    },
  },
  {
    name: "ahrefs_subscription_info",
    description: "Get Ahrefs subscription info",
    action: "ahrefs:subscription_info",
    inputSchema: z.object({}),
    handler: async (_params, context) => {
      return ahrefsFetch(context.serviceConnectionId, "/subscription-info");
    },
  },
];
