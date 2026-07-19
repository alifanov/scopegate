import { z } from 'zod';
import { stripeFetch } from '../stripe';
import { createFetchTool } from './fetch-tool';
import type { ToolDefinition } from './types';

export const stripeTools: ToolDefinition[] = [
  // =====================
  // Stripe tools
  // =====================
  createFetchTool(stripeFetch, {
    name: "stripe_list_customers",
    description: "List Stripe customers",
    action: "stripe:list_customers",
    inputSchema: z.object({
      limit: z.number().min(1).max(100).optional().default(10),
    }),
    path: "/customers",
    query: (params) => ({ limit: (params.limit as number) ?? 10 }),
  }),
  createFetchTool(stripeFetch, {
    name: "stripe_get_customer",
    description: "Get a Stripe customer by ID",
    action: "stripe:get_customer",
    inputSchema: z.object({ customerId: z.string() }),
    path: (params) => `/customers/${params.customerId}`,
  }),
  createFetchTool(stripeFetch, {
    name: "stripe_create_customer",
    description: "Create a new Stripe customer",
    action: "stripe:create_customer",
    inputSchema: z.object({
      email: z.string().optional(),
      name: z.string().optional(),
      description: z.string().optional(),
    }),
    path: "/customers",
    method: "POST",
    formData: (params) => {
      const formData: Record<string, string> = {};
      if (params.email) formData.email = params.email as string;
      if (params.name) formData.name = params.name as string;
      if (params.description) formData.description = params.description as string;
      return formData;
    },
  }),
  createFetchTool(stripeFetch, {
    name: "stripe_list_subscriptions",
    description: "List Stripe subscriptions",
    action: "stripe:list_subscriptions",
    inputSchema: z.object({
      limit: z.number().min(1).max(100).optional().default(10),
      customer: z.string().optional(),
    }),
    path: "/subscriptions",
    query: (params) => ({ limit: (params.limit as number) ?? 10, customer: params.customer as string | undefined }),
  }),
  createFetchTool(stripeFetch, {
    name: "stripe_get_subscription",
    description: "Get a Stripe subscription by ID",
    action: "stripe:get_subscription",
    inputSchema: z.object({ subscriptionId: z.string() }),
    path: (params) => `/subscriptions/${params.subscriptionId}`,
  }),
  createFetchTool(stripeFetch, {
    name: "stripe_list_invoices",
    description: "List Stripe invoices",
    action: "stripe:list_invoices",
    inputSchema: z.object({
      limit: z.number().min(1).max(100).optional().default(10),
      customer: z.string().optional(),
    }),
    path: "/invoices",
    query: (params) => ({ limit: (params.limit as number) ?? 10, customer: params.customer as string | undefined }),
  }),
  createFetchTool(stripeFetch, {
    name: "stripe_get_invoice",
    description: "Get a Stripe invoice by ID",
    action: "stripe:get_invoice",
    inputSchema: z.object({ invoiceId: z.string() }),
    path: (params) => `/invoices/${params.invoiceId}`,
  }),
  createFetchTool(stripeFetch, {
    name: "stripe_get_balance",
    description: "Get Stripe account balance",
    action: "stripe:get_balance",
    inputSchema: z.object({}),
    path: "/balance",
  }),
  createFetchTool(stripeFetch, {
    name: "stripe_list_charges",
    description: "List Stripe charges",
    action: "stripe:list_charges",
    inputSchema: z.object({
      limit: z.number().min(1).max(100).optional().default(10),
    }),
    path: "/charges",
    query: (params) => ({ limit: (params.limit as number) ?? 10 }),
  }),
  createFetchTool(stripeFetch, {
    name: "stripe_list_payment_intents",
    description: "List Stripe payment intents",
    action: "stripe:list_payment_intents",
    inputSchema: z.object({
      limit: z.number().min(1).max(100).optional().default(10),
    }),
    path: "/payment_intents",
    query: (params) => ({ limit: (params.limit as number) ?? 10 }),
  }),
];
