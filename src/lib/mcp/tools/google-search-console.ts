import { z } from 'zod';
import { googleSearchConsoleFetch, googleSearchConsoleV1Fetch } from '../google-search-console';
import type { ToolDefinition } from './types';

export const searchConsoleTools: ToolDefinition[] = [
  // Google Search Console tools
  {
    name: "searchConsole_list_sites",
    description: "List all sites verified in Google Search Console",
    action: "searchConsole:list_sites",
    inputSchema: z.object({}),
    handler: async (_params, context) => {
      return googleSearchConsoleFetch(
        context.serviceConnectionId,
        "/sites"
      );
    },
  },
  {
    name: "searchConsole_get_site",
    description: "Get details about a specific site in Google Search Console",
    action: "searchConsole:get_site",
    inputSchema: z.object({
      siteUrl: z.string(),
    }),
    handler: async (params, context) => {
      const encodedSiteUrl = encodeURIComponent(params.siteUrl as string);
      return googleSearchConsoleFetch(
        context.serviceConnectionId,
        `/sites/${encodedSiteUrl}`
      );
    },
  },
  {
    name: "searchConsole_add_site",
    description: "Add a site to Google Search Console",
    action: "searchConsole:add_site",
    inputSchema: z.object({
      siteUrl: z.string(),
    }),
    handler: async (params, context) => {
      const encodedSiteUrl = encodeURIComponent(params.siteUrl as string);
      return googleSearchConsoleFetch(
        context.serviceConnectionId,
        `/sites/${encodedSiteUrl}`,
        { method: "PUT" }
      );
    },
  },
  {
    name: "searchConsole_delete_site",
    description: "Remove a site from Google Search Console",
    action: "searchConsole:delete_site",
    inputSchema: z.object({
      siteUrl: z.string(),
    }),
    handler: async (params, context) => {
      const encodedSiteUrl = encodeURIComponent(params.siteUrl as string);
      return googleSearchConsoleFetch(
        context.serviceConnectionId,
        `/sites/${encodedSiteUrl}`,
        { method: "DELETE" }
      );
    },
  },
  {
    name: "searchConsole_query_analytics",
    description: "Query search analytics data for a site",
    action: "searchConsole:query_analytics",
    inputSchema: z.object({
      siteUrl: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      dimensions: z.array(z.string()).optional(),
      rowLimit: z.number().optional().default(1000),
      dimensionFilterGroups: z.array(z.object({
        filters: z.array(z.object({
          dimension: z.string(),
          operator: z.string(),
          expression: z.string(),
        })),
      })).optional(),
      type: z.string().optional(),
    }),
    handler: async (params, context) => {
      const encodedSiteUrl = encodeURIComponent(params.siteUrl as string);
      const body: Record<string, unknown> = {
        startDate: params.startDate,
        endDate: params.endDate,
      };
      if (params.dimensions) body.dimensions = params.dimensions;
      if (params.rowLimit) body.rowLimit = params.rowLimit;
      if (params.dimensionFilterGroups) body.dimensionFilterGroups = params.dimensionFilterGroups;
      if (params.type) body.type = params.type;

      return googleSearchConsoleFetch(
        context.serviceConnectionId,
        `/sites/${encodedSiteUrl}/searchAnalytics/query`,
        {
          method: "POST",
          body: JSON.stringify(body),
        }
      );
    },
  },
  {
    name: "searchConsole_inspect_url",
    description: "Inspect a URL in Google Search Console",
    action: "searchConsole:inspect_url",
    inputSchema: z.object({
      inspectionUrl: z.string(),
      siteUrl: z.string(),
      languageCode: z.string().optional(),
    }),
    handler: async (params, context) => {
      const body: Record<string, unknown> = {
        inspectionUrl: params.inspectionUrl,
        siteUrl: params.siteUrl,
      };
      if (params.languageCode) body.languageCode = params.languageCode;

      return googleSearchConsoleV1Fetch(
        context.serviceConnectionId,
        "/urlInspection/index:inspect",
        {
          method: "POST",
          body: JSON.stringify(body),
        }
      );
    },
  },
  {
    name: "searchConsole_list_sitemaps",
    description: "List sitemaps submitted for a site",
    action: "searchConsole:list_sitemaps",
    inputSchema: z.object({
      siteUrl: z.string(),
      sitemapIndex: z.string().optional(),
    }),
    handler: async (params, context) => {
      const encodedSiteUrl = encodeURIComponent(params.siteUrl as string);
      const query = params.sitemapIndex
        ? `?sitemapIndex=${encodeURIComponent(params.sitemapIndex as string)}`
        : "";
      return googleSearchConsoleFetch(
        context.serviceConnectionId,
        `/sites/${encodedSiteUrl}/sitemaps${query}`
      );
    },
  },
  {
    name: "searchConsole_get_sitemap",
    description: "Get details about a specific sitemap",
    action: "searchConsole:get_sitemap",
    inputSchema: z.object({
      siteUrl: z.string(),
      feedpath: z.string(),
    }),
    handler: async (params, context) => {
      const encodedSiteUrl = encodeURIComponent(params.siteUrl as string);
      const encodedFeedpath = encodeURIComponent(params.feedpath as string);
      return googleSearchConsoleFetch(
        context.serviceConnectionId,
        `/sites/${encodedSiteUrl}/sitemaps/${encodedFeedpath}`
      );
    },
  },
  {
    name: "searchConsole_submit_sitemap",
    description: "Submit a sitemap for a site",
    action: "searchConsole:submit_sitemap",
    inputSchema: z.object({
      siteUrl: z.string(),
      feedpath: z.string(),
    }),
    handler: async (params, context) => {
      const encodedSiteUrl = encodeURIComponent(params.siteUrl as string);
      const encodedFeedpath = encodeURIComponent(params.feedpath as string);
      return googleSearchConsoleFetch(
        context.serviceConnectionId,
        `/sites/${encodedSiteUrl}/sitemaps/${encodedFeedpath}`,
        { method: "PUT" }
      );
    },
  },
  {
    name: "searchConsole_delete_sitemap",
    description: "Delete a sitemap from Google Search Console",
    action: "searchConsole:delete_sitemap",
    inputSchema: z.object({
      siteUrl: z.string(),
      feedpath: z.string(),
    }),
    handler: async (params, context) => {
      const encodedSiteUrl = encodeURIComponent(params.siteUrl as string);
      const encodedFeedpath = encodeURIComponent(params.feedpath as string);
      return googleSearchConsoleFetch(
        context.serviceConnectionId,
        `/sites/${encodedSiteUrl}/sitemaps/${encodedFeedpath}`,
        { method: "DELETE" }
      );
    },
  },
];
