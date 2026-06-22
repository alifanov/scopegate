import type { z } from 'zod';
import type { ToolContext, ToolDefinition } from './types';
type FetchOptions = {
    method?: string;
    body?: string;
};
type Fetcher = (serviceConnectionId: string, path: string, options?: FetchOptions) => Promise<unknown>;
type FetchToolMetadata = {
    name: string;
    description: string;
    action: string;
    inputSchema: z.ZodType;
    path: string | ((params: Record<string, unknown>) => string);
    method?: string;
    body?: (params: Record<string, unknown>) => Record<string, unknown>;
};
function resolvePath(path: FetchToolMetadata['path'], params: Record<string, unknown>) {
    return typeof path === 'function' ? path(params) : path;
}
export function createFetchTool(fetcher: Fetcher, metadata: FetchToolMetadata): ToolDefinition {
    return {
        name: metadata.name,
        description: metadata.description,
        action: metadata.action,
        inputSchema: metadata.inputSchema,
        handler: async (params: Record<string, unknown>, context: ToolContext) => {
            const options = metadata.method || metadata.body
                ? {
                    ...(metadata.method ? { method: metadata.method } : {}),
                    ...(metadata.body
                        ? { body: JSON.stringify(metadata.body(params)) }
                        : {}),
                }
                : undefined;
            return fetcher(context.serviceConnectionId, resolvePath(metadata.path, params), options);
        },
    };
}
export function createFetchTools(fetcher: Fetcher, metadata: FetchToolMetadata[]): ToolDefinition[] {
    return metadata.map((tool) => createFetchTool(fetcher, tool));
}
