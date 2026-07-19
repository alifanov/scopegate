import { z } from 'zod';
import { serviceJsonFetch } from '@/lib/mcp/service-fetch';
import { createFetchTool } from './fetch-tool';
import type { ToolDefinition } from './types';

export const notionTools: ToolDefinition[] = [
  // =====================
  // Notion tools
  // =====================
  createFetchTool(serviceJsonFetch, {
    name: "notion_search",
    description: "Search across all pages and databases in Notion",
    action: "notion:search",
    inputSchema: z.object({
      query: z.string().optional(),
      filter: z.object({ value: z.enum(["page", "database"]), property: z.literal("object") }).optional(),
      page_size: z.number().min(1).max(100).optional().default(10),
    }),
    path: "/search",
    method: "POST",
    body: (params) => ({ query: params.query, filter: params.filter, page_size: params.page_size }),
  }),
  createFetchTool(serviceJsonFetch, {
    name: "notion_get_page",
    description: "Get a Notion page by ID",
    action: "notion:get_page",
    inputSchema: z.object({ page_id: z.string() }),
    path: (params) => `/pages/${params.page_id}`,
  }),
  createFetchTool(serviceJsonFetch, {
    name: "notion_create_page",
    description: "Create a new page in Notion",
    action: "notion:create_page",
    inputSchema: z.object({
      parent: z.object({ database_id: z.string().optional(), page_id: z.string().optional() }),
      properties: z.record(z.string(), z.unknown()),
      children: z.array(z.unknown()).optional(),
    }),
    path: "/pages",
    method: "POST",
    body: (params) => ({ parent: params.parent, properties: params.properties, children: params.children }),
  }),
  createFetchTool(serviceJsonFetch, {
    name: "notion_update_page",
    description: "Update properties of a Notion page",
    action: "notion:update_page",
    inputSchema: z.object({
      page_id: z.string(),
      properties: z.record(z.string(), z.unknown()),
      archived: z.boolean().optional(),
    }),
    path: (params) => `/pages/${params.page_id}`,
    method: "PATCH",
    body: (params) => ({ properties: params.properties, archived: params.archived }),
  }),
  createFetchTool(serviceJsonFetch, {
    name: "notion_get_database",
    description: "Get a Notion database by ID",
    action: "notion:get_database",
    inputSchema: z.object({ database_id: z.string() }),
    path: (params) => `/databases/${params.database_id}`,
  }),
  createFetchTool(serviceJsonFetch, {
    name: "notion_query_database",
    description: "Query a Notion database with optional filter and sort",
    action: "notion:query_database",
    inputSchema: z.object({
      database_id: z.string(),
      filter: z.record(z.string(), z.unknown()).optional(),
      sorts: z.array(z.unknown()).optional(),
      page_size: z.number().min(1).max(100).optional().default(10),
    }),
    path: (params) => `/databases/${params.database_id}/query`,
    method: "POST",
    body: (params) => ({ filter: params.filter, sorts: params.sorts, page_size: params.page_size }),
  }),
  createFetchTool(serviceJsonFetch, {
    name: "notion_create_database_item",
    description: "Create a new item (page) in a Notion database",
    action: "notion:create_database_item",
    inputSchema: z.object({
      database_id: z.string(),
      properties: z.record(z.string(), z.unknown()),
    }),
    path: "/pages",
    method: "POST",
    body: (params) => ({ parent: { database_id: params.database_id }, properties: params.properties }),
  }),
  createFetchTool(serviceJsonFetch, {
    name: "notion_get_block_children",
    description: "Get the content blocks of a Notion page or block",
    action: "notion:get_block_children",
    inputSchema: z.object({
      block_id: z.string(),
      page_size: z.number().min(1).max(100).optional().default(50),
    }),
    path: (params) => `/blocks/${params.block_id}/children`,
    query: (params) => ({ page_size: (params.page_size as number) ?? 50 }),
  }),
  createFetchTool(serviceJsonFetch, {
    name: "notion_append_block_children",
    description: "Append content blocks to a Notion page or block",
    action: "notion:append_block_children",
    inputSchema: z.object({
      block_id: z.string(),
      children: z.array(z.unknown()),
    }),
    path: (params) => `/blocks/${params.block_id}/children`,
    method: "PATCH",
    body: (params) => ({ children: params.children }),
  }),
  createFetchTool(serviceJsonFetch, {
    name: "notion_delete_block",
    description: "Delete (archive) a Notion block",
    action: "notion:delete_block",
    inputSchema: z.object({ block_id: z.string() }),
    path: (params) => `/blocks/${params.block_id}`,
    method: "DELETE",
  }),
  createFetchTool(serviceJsonFetch, {
    name: "notion_list_users",
    description: "List all users in the Notion workspace",
    action: "notion:list_users",
    inputSchema: z.object({
      page_size: z.number().min(1).max(100).optional().default(50),
    }),
    path: "/users",
    query: (params) => ({ page_size: (params.page_size as number) ?? 50 }),
  }),
];
