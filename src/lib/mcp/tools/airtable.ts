import { z } from 'zod';
import { serviceJsonFetch } from '@/lib/mcp/service-fetch';
import { createFetchTool } from './fetch-tool';
import type { ToolDefinition } from './types';

export const airtableTools: ToolDefinition[] = [
  // =====================
  // Airtable tools
  // =====================
  createFetchTool(serviceJsonFetch, {
    name: "airtable_list_bases",
    description: "List all Airtable bases",
    action: "airtable:list_bases",
    inputSchema: z.object({}),
    path: "/meta/bases",
  }),
  createFetchTool(serviceJsonFetch, {
    name: "airtable_get_base_schema",
    description: "Get the schema of an Airtable base",
    action: "airtable:get_base_schema",
    inputSchema: z.object({ baseId: z.string() }),
    path: (params) => `/meta/bases/${params.baseId}/tables`,
  }),
  createFetchTool(serviceJsonFetch, {
    name: "airtable_list_records",
    description: "List records in an Airtable table",
    action: "airtable:list_records",
    inputSchema: z.object({
      baseId: z.string(),
      tableIdOrName: z.string(),
      maxRecords: z.number().min(1).max(100).optional().default(20),
      view: z.string().optional(),
    }),
    path: (params) => `/${params.baseId}/${params.tableIdOrName}`,
    query: (params) => ({
      maxRecords: (params.maxRecords as number) ?? 20,
      view: params.view as string | undefined,
    }),
  }),
  createFetchTool(serviceJsonFetch, {
    name: "airtable_get_record",
    description: "Get a specific Airtable record",
    action: "airtable:get_record",
    inputSchema: z.object({
      baseId: z.string(),
      tableIdOrName: z.string(),
      recordId: z.string(),
    }),
    path: (params) => `/${params.baseId}/${params.tableIdOrName}/${params.recordId}`,
  }),
  createFetchTool(serviceJsonFetch, {
    name: "airtable_create_record",
    description: "Create a new record in an Airtable table",
    action: "airtable:create_record",
    inputSchema: z.object({
      baseId: z.string(),
      tableIdOrName: z.string(),
      fields: z.record(z.string(), z.unknown()),
    }),
    path: (params) => `/${params.baseId}/${params.tableIdOrName}`,
    method: "POST",
    body: (params) => ({ fields: params.fields }),
  }),
  createFetchTool(serviceJsonFetch, {
    name: "airtable_update_record",
    description: "Update an Airtable record",
    action: "airtable:update_record",
    inputSchema: z.object({
      baseId: z.string(),
      tableIdOrName: z.string(),
      recordId: z.string(),
      fields: z.record(z.string(), z.unknown()),
    }),
    path: (params) => `/${params.baseId}/${params.tableIdOrName}/${params.recordId}`,
    method: "PATCH",
    body: (params) => ({ fields: params.fields }),
  }),
  createFetchTool(serviceJsonFetch, {
    name: "airtable_delete_record",
    description: "Delete an Airtable record",
    action: "airtable:delete_record",
    inputSchema: z.object({
      baseId: z.string(),
      tableIdOrName: z.string(),
      recordId: z.string(),
    }),
    path: (params) => `/${params.baseId}/${params.tableIdOrName}/${params.recordId}`,
    method: "DELETE",
  }),
];
