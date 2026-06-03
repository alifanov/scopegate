import { z } from 'zod';
import { airtableFetch } from '../airtable';
import type { ToolDefinition } from './types';

export const airtableTools: ToolDefinition[] = [
  // =====================
  // Airtable tools
  // =====================
  {
    name: "airtable_list_bases",
    description: "List all Airtable bases",
    action: "airtable:list_bases",
    inputSchema: z.object({}),
    handler: async (_params, context) => {
      return airtableFetch(context.serviceConnectionId, "/meta/bases");
    },
  },
  {
    name: "airtable_get_base_schema",
    description: "Get the schema of an Airtable base",
    action: "airtable:get_base_schema",
    inputSchema: z.object({ baseId: z.string() }),
    handler: async (params, context) => {
      return airtableFetch(context.serviceConnectionId, `/meta/bases/${params.baseId}/tables`);
    },
  },
  {
    name: "airtable_list_records",
    description: "List records in an Airtable table",
    action: "airtable:list_records",
    inputSchema: z.object({
      baseId: z.string(),
      tableIdOrName: z.string(),
      maxRecords: z.number().min(1).max(100).optional().default(20),
      view: z.string().optional(),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({ maxRecords: String(params.maxRecords ?? 20) });
      if (params.view) query.set("view", params.view as string);
      return airtableFetch(context.serviceConnectionId, `/${params.baseId}/${params.tableIdOrName}?${query.toString()}`);
    },
  },
  {
    name: "airtable_get_record",
    description: "Get a specific Airtable record",
    action: "airtable:get_record",
    inputSchema: z.object({
      baseId: z.string(),
      tableIdOrName: z.string(),
      recordId: z.string(),
    }),
    handler: async (params, context) => {
      return airtableFetch(context.serviceConnectionId, `/${params.baseId}/${params.tableIdOrName}/${params.recordId}`);
    },
  },
  {
    name: "airtable_create_record",
    description: "Create a new record in an Airtable table",
    action: "airtable:create_record",
    inputSchema: z.object({
      baseId: z.string(),
      tableIdOrName: z.string(),
      fields: z.record(z.string(), z.unknown()),
    }),
    handler: async (params, context) => {
      return airtableFetch(context.serviceConnectionId, `/${params.baseId}/${params.tableIdOrName}`, {
        method: "POST",
        body: JSON.stringify({ fields: params.fields }),
      });
    },
  },
  {
    name: "airtable_update_record",
    description: "Update an Airtable record",
    action: "airtable:update_record",
    inputSchema: z.object({
      baseId: z.string(),
      tableIdOrName: z.string(),
      recordId: z.string(),
      fields: z.record(z.string(), z.unknown()),
    }),
    handler: async (params, context) => {
      return airtableFetch(context.serviceConnectionId, `/${params.baseId}/${params.tableIdOrName}/${params.recordId}`, {
        method: "PATCH",
        body: JSON.stringify({ fields: params.fields }),
      });
    },
  },
  {
    name: "airtable_delete_record",
    description: "Delete an Airtable record",
    action: "airtable:delete_record",
    inputSchema: z.object({
      baseId: z.string(),
      tableIdOrName: z.string(),
      recordId: z.string(),
    }),
    handler: async (params, context) => {
      return airtableFetch(context.serviceConnectionId, `/${params.baseId}/${params.tableIdOrName}/${params.recordId}`, {
        method: "DELETE",
      });
    },
  },
];
