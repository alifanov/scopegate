import { z } from 'zod';
import { openRouterFetch } from '../openrouter';
import type { ToolDefinition } from './types';

export const openRouterTools: ToolDefinition[] = [
  // OpenRouter tools
  {
    name: "openRouter_chat_completion",
    description: "Send a chat completion request to an AI model via OpenRouter",
    action: "openRouter:chat_completion",
    inputSchema: z.object({
      model: z.string(),
      messages: z.array(
        z.object({
          role: z.string(),
          content: z.string(),
        })
      ),
      temperature: z.number().optional(),
      max_tokens: z.number().optional(),
      top_p: z.number().optional(),
      stream: z.literal(false).optional(),
    }),
    handler: async (params, context) => {
      return openRouterFetch(
        context.serviceConnectionId,
        "/chat/completions",
        {
          method: "POST",
          body: JSON.stringify({
            model: params.model,
            messages: params.messages,
            temperature: params.temperature,
            max_tokens: params.max_tokens,
            top_p: params.top_p,
            stream: false,
          }),
        }
      );
    },
  },
  {
    name: "openRouter_get_generation",
    description: "Get metadata for a specific generation by ID",
    action: "openRouter:get_generation",
    inputSchema: z.object({
      id: z.string(),
    }),
    handler: async (params, context) => {
      return openRouterFetch(
        context.serviceConnectionId,
        `/generation?id=${encodeURIComponent(params.id as string)}`
      );
    },
  },
  {
    name: "openRouter_list_models",
    description: "List all available AI models on OpenRouter",
    action: "openRouter:list_models",
    inputSchema: z.object({}),
    handler: async (_params, context) => {
      return openRouterFetch(context.serviceConnectionId, "/models");
    },
  },
  {
    name: "openRouter_get_model_endpoints",
    description: "Get available endpoints for a specific model",
    action: "openRouter:get_model_endpoints",
    inputSchema: z.object({
      author: z.string(),
      slug: z.string(),
    }),
    handler: async (params, context) => {
      const author = encodeURIComponent(params.author as string);
      const slug = encodeURIComponent(params.slug as string);
      return openRouterFetch(
        context.serviceConnectionId,
        `/models/${author}/${slug}/endpoints`
      );
    },
  },
  {
    name: "openRouter_get_key_info",
    description: "Get API key details including daily, weekly, and monthly spend",
    action: "openRouter:get_key_info",
    inputSchema: z.object({}),
    handler: async (_params, context) => {
      return openRouterFetch(context.serviceConnectionId, "/key");
    },
  },
  {
    name: "openRouter_get_credits",
    description: "Get account credits and total usage",
    action: "openRouter:get_credits",
    inputSchema: z.object({}),
    handler: async (_params, context) => {
      return openRouterFetch(context.serviceConnectionId, "/credits");
    },
  },
  {
    name: "openRouter_get_activity",
    description: "Get usage metrics per model and day",
    action: "openRouter:get_activity",
    inputSchema: z.object({}),
    handler: async (_params, context) => {
      return openRouterFetch(context.serviceConnectionId, "/activity");
    },
  },
  {
    name: "openRouter_list_providers",
    description: "List all AI model providers on OpenRouter",
    action: "openRouter:list_providers",
    inputSchema: z.object({}),
    handler: async (_params, context) => {
      return openRouterFetch(context.serviceConnectionId, "/providers");
    },
  },
  {
    name: "openRouter_create_embeddings",
    description: "Generate vector embeddings using an AI model",
    action: "openRouter:create_embeddings",
    inputSchema: z.object({
      model: z.string(),
      input: z.union([z.string(), z.array(z.string())]),
    }),
    handler: async (params, context) => {
      return openRouterFetch(
        context.serviceConnectionId,
        "/embeddings",
        {
          method: "POST",
          body: JSON.stringify({
            model: params.model,
            input: params.input,
          }),
        }
      );
    },
  },
];
