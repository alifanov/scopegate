import { z } from 'zod';
import { serviceJsonFetch } from '@/lib/mcp/service-fetch';
import { createFetchTool } from './fetch-tool';
import type { ToolDefinition } from './types';

export const hubspotTools: ToolDefinition[] = [
  // =====================
  // HubSpot tools
  // =====================
  createFetchTool(serviceJsonFetch, {
    name: "hubspot_list_contacts",
    description: "List contacts in HubSpot CRM",
    action: "hubspot:list_contacts",
    inputSchema: z.object({
      limit: z.number().min(1).max(100).optional().default(10),
      properties: z.string().optional().describe("Comma-separated property names"),
    }),
    path: "/crm/v3/objects/contacts",
    query: (params) => ({ limit: (params.limit as number) ?? 10, properties: params.properties as string | undefined }),
  }),
  createFetchTool(serviceJsonFetch, {
    name: "hubspot_get_contact",
    description: "Get a contact by ID",
    action: "hubspot:get_contact",
    inputSchema: z.object({
      contactId: z.string(),
      properties: z.string().optional(),
    }),
    path: (params) => `/crm/v3/objects/contacts/${params.contactId}`,
    query: (params) => ({ properties: params.properties as string | undefined }),
  }),
  createFetchTool(serviceJsonFetch, {
    name: "hubspot_create_contact",
    description: "Create a new contact in HubSpot",
    action: "hubspot:create_contact",
    inputSchema: z.object({
      properties: z.record(z.string(), z.string()),
    }),
    path: "/crm/v3/objects/contacts",
    method: "POST",
    body: (params) => ({ properties: params.properties }),
  }),
  createFetchTool(serviceJsonFetch, {
    name: "hubspot_update_contact",
    description: "Update a contact in HubSpot",
    action: "hubspot:update_contact",
    inputSchema: z.object({
      contactId: z.string(),
      properties: z.record(z.string(), z.string()),
    }),
    path: (params) => `/crm/v3/objects/contacts/${params.contactId}`,
    method: "PATCH",
    body: (params) => ({ properties: params.properties }),
  }),
  createFetchTool(serviceJsonFetch, {
    name: "hubspot_search_contacts",
    description: "Search contacts in HubSpot",
    action: "hubspot:search_contacts",
    inputSchema: z.object({
      filterGroups: z.array(z.unknown()),
      sorts: z.array(z.unknown()).optional(),
      limit: z.number().min(1).max(100).optional().default(10),
    }),
    path: "/crm/v3/objects/contacts/search",
    method: "POST",
    body: (params) => ({ filterGroups: params.filterGroups, sorts: params.sorts, limit: params.limit }),
  }),
  createFetchTool(serviceJsonFetch, {
    name: "hubspot_list_deals",
    description: "List deals in HubSpot CRM",
    action: "hubspot:list_deals",
    inputSchema: z.object({
      limit: z.number().min(1).max(100).optional().default(10),
      properties: z.string().optional(),
    }),
    path: "/crm/v3/objects/deals",
    query: (params) => ({ limit: (params.limit as number) ?? 10, properties: params.properties as string | undefined }),
  }),
  createFetchTool(serviceJsonFetch, {
    name: "hubspot_get_deal",
    description: "Get a deal by ID",
    action: "hubspot:get_deal",
    inputSchema: z.object({
      dealId: z.string(),
      properties: z.string().optional(),
    }),
    path: (params) => `/crm/v3/objects/deals/${params.dealId}`,
    query: (params) => ({ properties: params.properties as string | undefined }),
  }),
  createFetchTool(serviceJsonFetch, {
    name: "hubspot_create_deal",
    description: "Create a new deal in HubSpot",
    action: "hubspot:create_deal",
    inputSchema: z.object({
      properties: z.record(z.string(), z.string()),
    }),
    path: "/crm/v3/objects/deals",
    method: "POST",
    body: (params) => ({ properties: params.properties }),
  }),
  createFetchTool(serviceJsonFetch, {
    name: "hubspot_update_deal",
    description: "Update a deal in HubSpot",
    action: "hubspot:update_deal",
    inputSchema: z.object({
      dealId: z.string(),
      properties: z.record(z.string(), z.string()),
    }),
    path: (params) => `/crm/v3/objects/deals/${params.dealId}`,
    method: "PATCH",
    body: (params) => ({ properties: params.properties }),
  }),
  createFetchTool(serviceJsonFetch, {
    name: "hubspot_list_companies",
    description: "List companies in HubSpot CRM",
    action: "hubspot:list_companies",
    inputSchema: z.object({
      limit: z.number().min(1).max(100).optional().default(10),
      properties: z.string().optional(),
    }),
    path: "/crm/v3/objects/companies",
    query: (params) => ({ limit: (params.limit as number) ?? 10, properties: params.properties as string | undefined }),
  }),
  createFetchTool(serviceJsonFetch, {
    name: "hubspot_get_company",
    description: "Get a company by ID",
    action: "hubspot:get_company",
    inputSchema: z.object({
      companyId: z.string(),
      properties: z.string().optional(),
    }),
    path: (params) => `/crm/v3/objects/companies/${params.companyId}`,
    query: (params) => ({ properties: params.properties as string | undefined }),
  }),
  createFetchTool(serviceJsonFetch, {
    name: "hubspot_create_company",
    description: "Create a new company in HubSpot",
    action: "hubspot:create_company",
    inputSchema: z.object({
      properties: z.record(z.string(), z.string()),
    }),
    path: "/crm/v3/objects/companies",
    method: "POST",
    body: (params) => ({ properties: params.properties }),
  }),
  createFetchTool(serviceJsonFetch, {
    name: "hubspot_update_company",
    description: "Update a company in HubSpot",
    action: "hubspot:update_company",
    inputSchema: z.object({
      companyId: z.string(),
      properties: z.record(z.string(), z.string()),
    }),
    path: (params) => `/crm/v3/objects/companies/${params.companyId}`,
    method: "PATCH",
    body: (params) => ({ properties: params.properties }),
  }),
  createFetchTool(serviceJsonFetch, {
    name: "hubspot_search_companies",
    description: "Search companies in HubSpot",
    action: "hubspot:search_companies",
    inputSchema: z.object({
      filterGroups: z.array(z.unknown()),
      sorts: z.array(z.unknown()).optional(),
      limit: z.number().min(1).max(100).optional().default(10),
    }),
    path: "/crm/v3/objects/companies/search",
    method: "POST",
    body: (params) => ({ filterGroups: params.filterGroups, sorts: params.sorts, limit: params.limit }),
  }),
];
