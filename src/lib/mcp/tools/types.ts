import { z } from 'zod';

export interface ToolContext {
  serviceConnectionId: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  action: string;
  inputSchema: z.ZodType;
  handler: (params: Record<string, unknown>, context: ToolContext) => Promise<unknown>;
}
