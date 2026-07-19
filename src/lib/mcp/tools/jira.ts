import { z } from 'zod';
import { serviceJsonFetch } from '@/lib/mcp/service-fetch';
import { createFetchTool } from './fetch-tool';
import type { ToolDefinition } from './types';

export const jiraTools: ToolDefinition[] = [
  // =====================
  // Jira tools
  // =====================
  createFetchTool(serviceJsonFetch, {
    name: "jira_list_projects",
    description: "List all Jira projects",
    action: "jira:list_projects",
    inputSchema: z.object({}),
    path: "/rest/api/3/project",
  }),
  createFetchTool(serviceJsonFetch, {
    name: "jira_get_project",
    description: "Get a Jira project by key or ID",
    action: "jira:get_project",
    inputSchema: z.object({ projectIdOrKey: z.string() }),
    path: (params) => `/rest/api/3/project/${params.projectIdOrKey}`,
  }),
  createFetchTool(serviceJsonFetch, {
    name: "jira_search_issues",
    description: "Search Jira issues using JQL",
    action: "jira:search_issues",
    inputSchema: z.object({
      jql: z.string(),
      maxResults: z.number().min(1).max(100).optional().default(20),
      fields: z.array(z.string()).optional(),
    }),
    path: "/rest/api/3/search",
    method: "POST",
    body: (params) => ({ jql: params.jql, maxResults: params.maxResults, fields: params.fields }),
  }),
  createFetchTool(serviceJsonFetch, {
    name: "jira_get_issue",
    description: "Get a Jira issue by key or ID",
    action: "jira:get_issue",
    inputSchema: z.object({ issueIdOrKey: z.string() }),
    path: (params) => `/rest/api/3/issue/${params.issueIdOrKey}`,
  }),
  createFetchTool(serviceJsonFetch, {
    name: "jira_create_issue",
    description: "Create a new Jira issue",
    action: "jira:create_issue",
    inputSchema: z.object({
      projectKey: z.string(),
      summary: z.string(),
      issueType: z.string().default("Task"),
      description: z.unknown().optional(),
      assigneeId: z.string().optional(),
      priority: z.string().optional(),
    }),
    path: "/rest/api/3/issue",
    method: "POST",
    body: (params) => {
      const fields: Record<string, unknown> = {
        project: { key: params.projectKey },
        summary: params.summary,
        issuetype: { name: params.issueType },
      };
      if (params.description) fields.description = params.description;
      if (params.assigneeId) fields.assignee = { accountId: params.assigneeId };
      if (params.priority) fields.priority = { name: params.priority };
      return { fields };
    },
  }),
  createFetchTool(serviceJsonFetch, {
    name: "jira_update_issue",
    description: "Update a Jira issue",
    action: "jira:update_issue",
    inputSchema: z.object({
      issueIdOrKey: z.string(),
      fields: z.record(z.string(), z.unknown()),
    }),
    path: (params) => `/rest/api/3/issue/${params.issueIdOrKey}`,
    method: "PUT",
    body: (params) => ({ fields: params.fields }),
  }),
  createFetchTool(serviceJsonFetch, {
    name: "jira_add_comment",
    description: "Add a comment to a Jira issue",
    action: "jira:add_comment",
    inputSchema: z.object({
      issueIdOrKey: z.string(),
      body: z.unknown().describe("Comment body in Atlassian Document Format or simple text"),
    }),
    path: (params) => `/rest/api/3/issue/${params.issueIdOrKey}/comment`,
    method: "POST",
    body: (params) => ({ body: params.body }),
  }),
  createFetchTool(serviceJsonFetch, {
    name: "jira_list_sprints",
    description: "List sprints for a Jira board",
    action: "jira:list_sprints",
    inputSchema: z.object({
      boardId: z.number(),
      state: z.string().optional().describe("active, closed, or future"),
    }),
    path: (params) => `/rest/agile/1.0/board/${params.boardId}/sprint`,
    query: (params) => ({ state: params.state as string | undefined }),
  }),
  createFetchTool(serviceJsonFetch, {
    name: "jira_get_transitions",
    description: "Get available transitions for a Jira issue",
    action: "jira:get_transitions",
    inputSchema: z.object({ issueIdOrKey: z.string() }),
    path: (params) => `/rest/api/3/issue/${params.issueIdOrKey}/transitions`,
  }),
  createFetchTool(serviceJsonFetch, {
    name: "jira_transition_issue",
    description: "Transition a Jira issue to a new status",
    action: "jira:transition_issue",
    inputSchema: z.object({
      issueIdOrKey: z.string(),
      transitionId: z.string(),
    }),
    path: (params) => `/rest/api/3/issue/${params.issueIdOrKey}/transitions`,
    method: "POST",
    body: (params) => ({ transition: { id: params.transitionId } }),
  }),
];
