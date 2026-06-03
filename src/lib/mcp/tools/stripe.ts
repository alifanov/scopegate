import { z } from 'zod';
import { stripeFetch } from '../stripe';
import type { ToolDefinition } from './types';

export const stripeTools: ToolDefinition[] = [
  // =====================
  // Stripe tools
  // =====================
  {
    name: "stripe_list_customers",
    description: "List Stripe customers",
    action: "stripe:list_customers",
    inputSchema: z.object({
      limit: z.number().min(1).max(100).optional().default(10),
    }),
    handler: async (params, context) => {
      return stripeFetch(context.serviceConnectionId, `/customers?limit=${params.limit ?? 10}`);
    },
  },
  {
    name: "stripe_get_customer",
    description: "Get a Stripe customer by ID",
    action: "stripe:get_customer",
    inputSchema: z.object({ customerId: z.string() }),
    handler: async (params, context) => {
      return stripeFetch(context.serviceConnectionId, `/customers/${params.customerId}`);
    },
  },
  {
    name: "stripe_create_customer",
    description: "Create a new Stripe customer",
    action: "stripe:create_customer",
    inputSchema: z.object({
      email: z.string().optional(),
      name: z.string().optional(),
      description: z.string().optional(),
    }),
    handler: async (params, context) => {
      const formData: Record<string, string> = {};
      if (params.email) formData.email = params.email as string;
      if (params.name) formData.name = params.name as string;
      if (params.description) formData.description = params.description as string;
      return stripeFetch(context.serviceConnectionId, "/customers", { method: "POST", formData });
    },
  },
  {
    name: "stripe_list_subscriptions",
    description: "List Stripe subscriptions",
    action: "stripe:list_subscriptions",
    inputSchema: z.object({
      limit: z.number().min(1).max(100).optional().default(10),
      customer: z.string().optional(),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({ limit: String(params.limit ?? 10) });
      if (params.customer) query.set("customer", params.customer as string);
      return stripeFetch(context.serviceConnectionId, `/subscriptions?${query.toString()}`);
    },
  },
  {
    name: "stripe_get_subscription",
    description: "Get a Stripe subscription by ID",
    action: "stripe:get_subscription",
    inputSchema: z.object({ subscriptionId: z.string() }),
    handler: async (params, context) => {
      return stripeFetch(context.serviceConnectionId, `/subscriptions/${params.subscriptionId}`);
    },
  },
  {
    name: "stripe_list_invoices",
    description: "List Stripe invoices",
    action: "stripe:list_invoices",
    inputSchema: z.object({
      limit: z.number().min(1).max(100).optional().default(10),
      customer: z.string().optional(),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({ limit: String(params.limit ?? 10) });
      if (params.customer) query.set("customer", params.customer as string);
      return stripeFetch(context.serviceConnectionId, `/invoices?${query.toString()}`);
    },
  },
  {
    name: "stripe_get_invoice",
    description: "Get a Stripe invoice by ID",
    action: "stripe:get_invoice",
    inputSchema: z.object({ invoiceId: z.string() }),
    handler: async (params, context) => {
      return stripeFetch(context.serviceConnectionId, `/invoices/${params.invoiceId}`);
    },
  },
  {
    name: "stripe_get_balance",
    description: "Get Stripe account balance",
    action: "stripe:get_balance",
    inputSchema: z.object({}),
    handler: async (_params, context) => {
      return stripeFetch(context.serviceConnectionId, "/balance");
    },
  },
  {
    name: "stripe_list_charges",
    description: "List Stripe charges",
    action: "stripe:list_charges",
    inputSchema: z.object({
      limit: z.number().min(1).max(100).optional().default(10),
    }),
    handler: async (params, context) => {
      return stripeFetch(context.serviceConnectionId, `/charges?limit=${params.limit ?? 10}`);
    },
  },
  {
    name: "stripe_list_payment_intents",
    description: "List Stripe payment intents",
    action: "stripe:list_payment_intents",
    inputSchema: z.object({
      limit: z.number().min(1).max(100).optional().default(10),
    }),
    handler: async (params, context) => {
      return stripeFetch(context.serviceConnectionId, `/payment_intents?limit=${params.limit ?? 10}`);
    },
  },
];
