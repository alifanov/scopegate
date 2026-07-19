import type { z } from 'zod';
import type { ToolContext, ToolDefinition } from './types';
type QueryValue = string | number | boolean | undefined;
type FetchOptions = {
    method?: string;
    body?: string;
    formData?: Record<string, string>;
};
type Fetcher = (serviceConnectionId: string, path: string, options?: FetchOptions) => Promise<unknown>;
type FetchToolMetadata = {
    name: string;
    description: string;
    action: string;
    inputSchema: z.ZodType;
    path: string | ((params: Record<string, unknown>) => string);
    query?: (params: Record<string, unknown>) => Record<string, QueryValue>;
    method?: string;
    body?: (params: Record<string, unknown>) => Record<string, unknown>;
    formData?: (params: Record<string, unknown>) => Record<string, string>;
};
function resolvePath(path: FetchToolMetadata['path'], params: Record<string, unknown>) {
    return typeof path === 'function' ? path(params) : path;
}
function appendQuery(path: string, query?: Record<string, QueryValue>) {
    if (!query) return path;
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) search.set(key, String(value));
    }
    const qs = search.toString();
    return qs ? `${path}${path.includes('?') ? '&' : '?'}${qs}` : path;
}
export function createFetchTool(fetcher: Fetcher, metadata: FetchToolMetadata): ToolDefinition {
    return {
        name: metadata.name,
        description: metadata.description,
        action: metadata.action,
        inputSchema: metadata.inputSchema,
        handler: async (params: Record<string, unknown>, context: ToolContext) => {
            const path = appendQuery(resolvePath(metadata.path, params), metadata.query?.(params));
            const formData = metadata.formData?.(params);
            const options = metadata.method || metadata.body || formData
                ? {
                    ...(metadata.method ? { method: metadata.method } : {}),
                    ...(metadata.body
                        ? { body: JSON.stringify(metadata.body(params)) }
                        : {}),
                    ...(formData ? { formData } : {}),
                }
                : undefined;
            return fetcher(context.serviceConnectionId, path, options);
        },
    };
}
export function createFetchTools(fetcher: Fetcher, metadata: FetchToolMetadata[]): ToolDefinition[] {
    return metadata.map((tool) => createFetchTool(fetcher, tool));
}
