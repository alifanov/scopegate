import { z } from 'zod';
import { notionFetch } from '../notion';
import type { ToolDefinition } from './types';

export const notionTools: ToolDefinition[] = [
  // =====================
  // Notion tools
  // =====================
  {
    name: "notion_search",
    description: "Search across all pages and databases in Notion",
    action: "notion:search",
    inputSchema: z.object({
      query: z.string().optional(),
      filter: z.object({ value: z.enum(["page", "database"]), property: z.literal("object") }).optional(),
      page_size: z.number().min(1).max(100).optional().default(10),
    }),
    handler: async (params, context) => {
      return notionFetch(context.serviceConnectionId, "/search", {
        method: "POST",
        body: JSON.stringify({ query: params.query, filter: params.filter, page_size: params.page_size }),
      });
    },
  },
  {
    name: "notion_get_page",
    description: "Get a Notion page by ID",
    action: "notion:get_page",
    inputSchema: z.object({ page_id: z.string() }),
    handler: async (params, context) => {
      return notionFetch(context.serviceConnectionId, `/pages/${params.page_id}`);
    },
  },
  {
    name: "notion_create_page",
    description: "Create a new page in Notion",
    action: "notion:create_page",
    inputSchema: z.object({
      parent: z.object({ database_id: z.string().optional(), page_id: z.string().optional() }),
      properties: z.record(z.string(), z.unknown()),
      children: z.array(z.unknown()).optional(),
    }),
    handler: async (params, context) => {
      return notionFetch(context.serviceConnectionId, "/pages", {
        method: "POST",
        body: JSON.stringify({ parent: params.parent, properties: params.properties, children: params.children }),
      });
    },
  },
  {
    name: "notion_update_page",
    description: "Update properties of a Notion page",
    action: "notion:update_page",
    inputSchema: z.object({
      page_id: z.string(),
      properties: z.record(z.string(), z.unknown()),
      archived: z.boolean().optional(),
    }),
    handler: async (params, context) => {
      return notionFetch(context.serviceConnectionId, `/pages/${params.page_id}`, {
        method: "PATCH",
        body: JSON.stringify({ properties: params.properties, archived: params.archived }),
      });
    },
  },
  {
    name: "notion_get_database",
    description: "Get a Notion database by ID",
    action: "notion:get_database",
    inputSchema: z.object({ database_id: z.string() }),
    handler: async (params, context) => {
      return notionFetch(context.serviceConnectionId, `/databases/${params.database_id}`);
    },
  },
  {
    name: "notion_query_database",
    description: "Query a Notion database with optional filter and sort",
    action: "notion:query_database",
    inputSchema: z.object({
      database_id: z.string(),
      filter: z.record(z.string(), z.unknown()).optional(),
      sorts: z.array(z.unknown()).optional(),
      page_size: z.number().min(1).max(100).optional().default(10),
    }),
    handler: async (params, context) => {
      return notionFetch(context.serviceConnectionId, `/databases/${params.database_id}/query`, {
        method: "POST",
        body: JSON.stringify({ filter: params.filter, sorts: params.sorts, page_size: params.page_size }),
      });
    },
  },
  {
    name: "notion_create_database_item",
    description: "Create a new item (page) in a Notion database",
    action: "notion:create_database_item",
    inputSchema: z.object({
      database_id: z.string(),
      properties: z.record(z.string(), z.unknown()),
    }),
    handler: async (params, context) => {
      return notionFetch(context.serviceConnectionId, "/pages", {
        method: "POST",
        body: JSON.stringify({ parent: { database_id: params.database_id }, properties: params.properties }),
      });
    },
  },
  {
    name: "notion_get_block_children",
    description: "Get the content blocks of a Notion page or block",
    action: "notion:get_block_children",
    inputSchema: z.object({
      block_id: z.string(),
      page_size: z.number().min(1).max(100).optional().default(50),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({ page_size: String(params.page_size ?? 50) });
      return notionFetch(context.serviceConnectionId, `/blocks/${params.block_id}/children?${query.toString()}`);
    },
  },
  {
    name: "notion_append_block_children",
    description: "Append content blocks to a Notion page or block",
    action: "notion:append_block_children",
    inputSchema: z.object({
      block_id: z.string(),
      children: z.array(z.unknown()),
    }),
    handler: async (params, context) => {
      return notionFetch(context.serviceConnectionId, `/blocks/${params.block_id}/children`, {
        method: "PATCH",
        body: JSON.stringify({ children: params.children }),
      });
    },
  },
  {
    name: "notion_delete_block",
    description: "Delete (archive) a Notion block",
    action: "notion:delete_block",
    inputSchema: z.object({ block_id: z.string() }),
    handler: async (params, context) => {
      return notionFetch(context.serviceConnectionId, `/blocks/${params.block_id}`, { method: "DELETE" });
    },
  },
  {
    name: "notion_list_users",
    description: "List all users in the Notion workspace",
    action: "notion:list_users",
    inputSchema: z.object({
      page_size: z.number().min(1).max(100).optional().default(50),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({ page_size: String(params.page_size ?? 50) });
      return notionFetch(context.serviceConnectionId, `/users?${query.toString()}`);
    },
  },
];
