import { z } from 'zod';
import { serviceJsonFetch } from '@/lib/mcp/service-fetch';
import { createFetchTool } from './fetch-tool';
import type { ToolDefinition } from './types';

export const salesforceTools: ToolDefinition[] = [
  // =====================
  // Salesforce tools
  // =====================
  createFetchTool(serviceJsonFetch, {
    name: "salesforce_query",
    description: "Execute a SOQL query against Salesforce",
    action: "salesforce:query",
    inputSchema: z.object({ soql: z.string() }),
    path: "/services/data/v59.0/query",
    query: (params) => ({ q: params.soql as string }),
  }),
  createFetchTool(serviceJsonFetch, {
    name: "salesforce_get_record",
    description: "Get a Salesforce record by type and ID",
    action: "salesforce:get_record",
    inputSchema: z.object({
      objectType: z.string(),
      recordId: z.string(),
    }),
    path: (params) => `/services/data/v59.0/sobjects/${params.objectType}/${params.recordId}`,
  }),
  createFetchTool(serviceJsonFetch, {
    name: "salesforce_create_record",
    description: "Create a new Salesforce record",
    action: "salesforce:create_record",
    inputSchema: z.object({
      objectType: z.string(),
      fields: z.record(z.string(), z.unknown()),
    }),
    path: (params) => `/services/data/v59.0/sobjects/${params.objectType}`,
    method: "POST",
    body: (params) => params.fields as Record<string, unknown>,
  }),
  createFetchTool(serviceJsonFetch, {
    name: "salesforce_update_record",
    description: "Update a Salesforce record",
    action: "salesforce:update_record",
    inputSchema: z.object({
      objectType: z.string(),
      recordId: z.string(),
      fields: z.record(z.string(), z.unknown()),
    }),
    path: (params) => `/services/data/v59.0/sobjects/${params.objectType}/${params.recordId}`,
    method: "PATCH",
    body: (params) => params.fields as Record<string, unknown>,
  }),
  createFetchTool(serviceJsonFetch, {
    name: "salesforce_delete_record",
    description: "Delete a Salesforce record",
    action: "salesforce:delete_record",
    inputSchema: z.object({
      objectType: z.string(),
      recordId: z.string(),
    }),
    path: (params) => `/services/data/v59.0/sobjects/${params.objectType}/${params.recordId}`,
    method: "DELETE",
  }),
  createFetchTool(serviceJsonFetch, {
    name: "salesforce_describe_object",
    description: "Describe a Salesforce object schema",
    action: "salesforce:describe_object",
    inputSchema: z.object({ objectType: z.string() }),
    path: (params) => `/services/data/v59.0/sobjects/${params.objectType}/describe`,
  }),
  createFetchTool(serviceJsonFetch, {
    name: "salesforce_list_objects",
    description: "List available Salesforce objects",
    action: "salesforce:list_objects",
    inputSchema: z.object({}),
    path: "/services/data/v59.0/sobjects",
  }),
  createFetchTool(serviceJsonFetch, {
    name: "salesforce_search",
    description: "Execute a SOSL search in Salesforce",
    action: "salesforce:search",
    inputSchema: z.object({ sosl: z.string() }),
    path: "/services/data/v59.0/search",
    query: (params) => ({ q: params.sosl as string }),
  }),
];
