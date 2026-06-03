import { z } from 'zod';
import { jiraFetch } from '../jira';
import type { ToolDefinition } from './types';

export const jiraTools: ToolDefinition[] = [
  // =====================
  // Jira tools
  // =====================
  {
    name: "jira_list_projects",
    description: "List all Jira projects",
    action: "jira:list_projects",
    inputSchema: z.object({}),
    handler: async (_params, context) => {
      return jiraFetch(context.serviceConnectionId, "/rest/api/3/project");
    },
  },
  {
    name: "jira_get_project",
    description: "Get a Jira project by key or ID",
    action: "jira:get_project",
    inputSchema: z.object({ projectIdOrKey: z.string() }),
    handler: async (params, context) => {
      return jiraFetch(context.serviceConnectionId, `/rest/api/3/project/${params.projectIdOrKey}`);
    },
  },
  {
    name: "jira_search_issues",
    description: "Search Jira issues using JQL",
    action: "jira:search_issues",
    inputSchema: z.object({
      jql: z.string(),
      maxResults: z.number().min(1).max(100).optional().default(20),
      fields: z.array(z.string()).optional(),
    }),
    handler: async (params, context) => {
      return jiraFetch(context.serviceConnectionId, "/rest/api/3/search", {
        method: "POST",
        body: JSON.stringify({ jql: params.jql, maxResults: params.maxResults, fields: params.fields }),
      });
    },
  },
  {
    name: "jira_get_issue",
    description: "Get a Jira issue by key or ID",
    action: "jira:get_issue",
    inputSchema: z.object({ issueIdOrKey: z.string() }),
    handler: async (params, context) => {
      return jiraFetch(context.serviceConnectionId, `/rest/api/3/issue/${params.issueIdOrKey}`);
    },
  },
  {
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
    handler: async (params, context) => {
      const fields: Record<string, unknown> = {
        project: { key: params.projectKey },
        summary: params.summary,
        issuetype: { name: params.issueType },
      };
      if (params.description) fields.description = params.description;
      if (params.assigneeId) fields.assignee = { accountId: params.assigneeId };
      if (params.priority) fields.priority = { name: params.priority };
      return jiraFetch(context.serviceConnectionId, "/rest/api/3/issue", {
        method: "POST",
        body: JSON.stringify({ fields }),
      });
    },
  },
  {
    name: "jira_update_issue",
    description: "Update a Jira issue",
    action: "jira:update_issue",
    inputSchema: z.object({
      issueIdOrKey: z.string(),
      fields: z.record(z.string(), z.unknown()),
    }),
    handler: async (params, context) => {
      return jiraFetch(context.serviceConnectionId, `/rest/api/3/issue/${params.issueIdOrKey}`, {
        method: "PUT",
        body: JSON.stringify({ fields: params.fields }),
      });
    },
  },
  {
    name: "jira_add_comment",
    description: "Add a comment to a Jira issue",
    action: "jira:add_comment",
    inputSchema: z.object({
      issueIdOrKey: z.string(),
      body: z.unknown().describe("Comment body in Atlassian Document Format or simple text"),
    }),
    handler: async (params, context) => {
      return jiraFetch(context.serviceConnectionId, `/rest/api/3/issue/${params.issueIdOrKey}/comment`, {
        method: "POST",
        body: JSON.stringify({ body: params.body }),
      });
    },
  },
  {
    name: "jira_list_sprints",
    description: "List sprints for a Jira board",
    action: "jira:list_sprints",
    inputSchema: z.object({
      boardId: z.number(),
      state: z.string().optional().describe("active, closed, or future"),
    }),
    handler: async (params, context) => {
      const query = params.state ? `?state=${params.state}` : "";
      return jiraFetch(context.serviceConnectionId, `/rest/agile/1.0/board/${params.boardId}/sprint${query}`);
    },
  },
  {
    name: "jira_get_transitions",
    description: "Get available transitions for a Jira issue",
    action: "jira:get_transitions",
    inputSchema: z.object({ issueIdOrKey: z.string() }),
    handler: async (params, context) => {
      return jiraFetch(context.serviceConnectionId, `/rest/api/3/issue/${params.issueIdOrKey}/transitions`);
    },
  },
  {
    name: "jira_transition_issue",
    description: "Transition a Jira issue to a new status",
    action: "jira:transition_issue",
    inputSchema: z.object({
      issueIdOrKey: z.string(),
      transitionId: z.string(),
    }),
    handler: async (params, context) => {
      return jiraFetch(context.serviceConnectionId, `/rest/api/3/issue/${params.issueIdOrKey}/transitions`, {
        method: "POST",
        body: JSON.stringify({ transition: { id: params.transitionId } }),
      });
    },
  },
];
