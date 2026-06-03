import { z } from 'zod';
import { salesforceFetch } from '../salesforce';
import type { ToolDefinition } from './types';

export const salesforceTools: ToolDefinition[] = [
  // =====================
  // Salesforce tools
  // =====================
  {
    name: "salesforce_query",
    description: "Execute a SOQL query against Salesforce",
    action: "salesforce:query",
    inputSchema: z.object({ soql: z.string() }),
    handler: async (params, context) => {
      const q = encodeURIComponent(params.soql as string);
      return salesforceFetch(context.serviceConnectionId, `/services/data/v59.0/query?q=${q}`);
    },
  },
  {
    name: "salesforce_get_record",
    description: "Get a Salesforce record by type and ID",
    action: "salesforce:get_record",
    inputSchema: z.object({
      objectType: z.string(),
      recordId: z.string(),
    }),
    handler: async (params, context) => {
      return salesforceFetch(context.serviceConnectionId, `/services/data/v59.0/sobjects/${params.objectType}/${params.recordId}`);
    },
  },
  {
    name: "salesforce_create_record",
    description: "Create a new Salesforce record",
    action: "salesforce:create_record",
    inputSchema: z.object({
      objectType: z.string(),
      fields: z.record(z.string(), z.unknown()),
    }),
    handler: async (params, context) => {
      return salesforceFetch(context.serviceConnectionId, `/services/data/v59.0/sobjects/${params.objectType}`, {
        method: "POST",
        body: JSON.stringify(params.fields),
      });
    },
  },
  {
    name: "salesforce_update_record",
    description: "Update a Salesforce record",
    action: "salesforce:update_record",
    inputSchema: z.object({
      objectType: z.string(),
      recordId: z.string(),
      fields: z.record(z.string(), z.unknown()),
    }),
    handler: async (params, context) => {
      return salesforceFetch(context.serviceConnectionId, `/services/data/v59.0/sobjects/${params.objectType}/${params.recordId}`, {
        method: "PATCH",
        body: JSON.stringify(params.fields),
      });
    },
  },
  {
    name: "salesforce_delete_record",
    description: "Delete a Salesforce record",
    action: "salesforce:delete_record",
    inputSchema: z.object({
      objectType: z.string(),
      recordId: z.string(),
    }),
    handler: async (params, context) => {
      return salesforceFetch(context.serviceConnectionId, `/services/data/v59.0/sobjects/${params.objectType}/${params.recordId}`, {
        method: "DELETE",
      });
    },
  },
  {
    name: "salesforce_describe_object",
    description: "Describe a Salesforce object schema",
    action: "salesforce:describe_object",
    inputSchema: z.object({ objectType: z.string() }),
    handler: async (params, context) => {
      return salesforceFetch(context.serviceConnectionId, `/services/data/v59.0/sobjects/${params.objectType}/describe`);
    },
  },
  {
    name: "salesforce_list_objects",
    description: "List available Salesforce objects",
    action: "salesforce:list_objects",
    inputSchema: z.object({}),
    handler: async (_params, context) => {
      return salesforceFetch(context.serviceConnectionId, "/services/data/v59.0/sobjects");
    },
  },
  {
    name: "salesforce_search",
    description: "Execute a SOSL search in Salesforce",
    action: "salesforce:search",
    inputSchema: z.object({ sosl: z.string() }),
    handler: async (params, context) => {
      const q = encodeURIComponent(params.sosl as string);
      return salesforceFetch(context.serviceConnectionId, `/services/data/v59.0/search?q=${q}`);
    },
  },
];
