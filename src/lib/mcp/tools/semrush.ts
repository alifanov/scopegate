import { z } from 'zod';
import { semrushFetch } from '../semrush';
import type { ToolDefinition } from './types';

export const semrushTools: ToolDefinition[] = [
  // =====================
  // SEMrush tools
  // =====================
  {
    name: "semrush_domain_overview",
    description: "Get domain overview metrics from SEMrush",
    action: "semrush:domain_overview",
    inputSchema: z.object({
      domain: z.string(),
      database: z.string().optional().default("us"),
    }),
    handler: async (params, context) => {
      return semrushFetch(context.serviceConnectionId, {
        type: "domain_ranks",
        domain: params.domain as string,
        database: (params.database as string) || "us",
        export_columns: "Dn,Rk,Or,Ot,Oc,Ad,At,Ac",
      });
    },
  },
  {
    name: "semrush_domain_organic",
    description: "Get organic search data for a domain",
    action: "semrush:domain_organic",
    inputSchema: z.object({
      domain: z.string(),
      database: z.string().optional().default("us"),
      display_limit: z.number().optional().default(10),
    }),
    handler: async (params, context) => {
      return semrushFetch(context.serviceConnectionId, {
        type: "domain_organic",
        domain: params.domain as string,
        database: (params.database as string) || "us",
        display_limit: String(params.display_limit ?? 10),
        export_columns: "Ph,Po,Nq,Cp,Ur,Tr,Tc,Co,Nr",
      });
    },
  },
  {
    name: "semrush_domain_organic_keywords",
    description: "Get organic keywords for a domain",
    action: "semrush:domain_organic_keywords",
    inputSchema: z.object({
      domain: z.string(),
      database: z.string().optional().default("us"),
      display_limit: z.number().optional().default(10),
    }),
    handler: async (params, context) => {
      return semrushFetch(context.serviceConnectionId, {
        type: "domain_organic",
        domain: params.domain as string,
        database: (params.database as string) || "us",
        display_limit: String(params.display_limit ?? 10),
        export_columns: "Ph,Po,Nq,Cp,Ur,Tr,Tc,Co,Nr",
      });
    },
  },
  {
    name: "semrush_keyword_overview",
    description: "Get keyword overview data",
    action: "semrush:keyword_overview",
    inputSchema: z.object({
      phrase: z.string(),
      database: z.string().optional().default("us"),
    }),
    handler: async (params, context) => {
      return semrushFetch(context.serviceConnectionId, {
        type: "phrase_all",
        phrase: params.phrase as string,
        database: (params.database as string) || "us",
        export_columns: "Ph,Nq,Cp,Co,Nr,Td",
      });
    },
  },
  {
    name: "semrush_keyword_difficulty",
    description: "Get keyword difficulty score",
    action: "semrush:keyword_difficulty",
    inputSchema: z.object({
      phrase: z.string(),
      database: z.string().optional().default("us"),
    }),
    handler: async (params, context) => {
      return semrushFetch(context.serviceConnectionId, {
        type: "phrase_kdi",
        phrase: params.phrase as string,
        database: (params.database as string) || "us",
        export_columns: "Ph,Kd",
      });
    },
  },
  {
    name: "semrush_backlinks_overview",
    description: "Get backlinks overview for a domain",
    action: "semrush:backlinks_overview",
    inputSchema: z.object({
      target: z.string(),
      target_type: z.enum(["root_domain", "domain", "url"]).optional().default("root_domain"),
    }),
    handler: async (params, context) => {
      return semrushFetch(context.serviceConnectionId, {
        type: "backlinks_overview",
        target: params.target as string,
        target_type: (params.target_type as string) || "root_domain",
        export_columns: "total,domains_num,urls_num,ips_num,follows_num,nofollows_num",
      });
    },
  },
];
