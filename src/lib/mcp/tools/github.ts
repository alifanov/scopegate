import { z } from 'zod';
import { githubFetch } from '../github';
import type { ToolDefinition } from './types';

export const githubTools: ToolDefinition[] = [
  // =====================
  // GitHub tools
  // =====================
  {
    name: "github_list_repos",
    description: "List repositories for the authenticated user",
    action: "github:list_repos",
    inputSchema: z.object({
      per_page: z.number().min(1).max(100).optional().default(30),
      sort: z.enum(["created", "updated", "pushed", "full_name"]).optional().default("updated"),
      type: z.enum(["all", "owner", "public", "private", "member"]).optional().default("all"),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({
        per_page: String(params.per_page ?? 30),
        sort: (params.sort as string) || "updated",
        type: (params.type as string) || "all",
      });
      return githubFetch(context.serviceConnectionId, `/user/repos?${query.toString()}`);
    },
  },
  {
    name: "github_get_repo",
    description: "Get a repository by owner and name",
    action: "github:get_repo",
    inputSchema: z.object({ owner: z.string(), repo: z.string() }),
    handler: async (params, context) => {
      return githubFetch(context.serviceConnectionId, `/repos/${params.owner}/${params.repo}`);
    },
  },
  {
    name: "github_list_issues",
    description: "List issues for a repository",
    action: "github:list_issues",
    inputSchema: z.object({
      owner: z.string(),
      repo: z.string(),
      state: z.enum(["open", "closed", "all"]).optional().default("open"),
      per_page: z.number().min(1).max(100).optional().default(30),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({
        state: (params.state as string) || "open",
        per_page: String(params.per_page ?? 30),
      });
      return githubFetch(context.serviceConnectionId, `/repos/${params.owner}/${params.repo}/issues?${query.toString()}`);
    },
  },
  {
    name: "github_get_issue",
    description: "Get a specific issue",
    action: "github:get_issue",
    inputSchema: z.object({
      owner: z.string(),
      repo: z.string(),
      issue_number: z.number(),
    }),
    handler: async (params, context) => {
      return githubFetch(context.serviceConnectionId, `/repos/${params.owner}/${params.repo}/issues/${params.issue_number}`);
    },
  },
  {
    name: "github_create_issue",
    description: "Create a new issue",
    action: "github:create_issue",
    inputSchema: z.object({
      owner: z.string(),
      repo: z.string(),
      title: z.string(),
      body: z.string().optional(),
      labels: z.array(z.string()).optional(),
      assignees: z.array(z.string()).optional(),
    }),
    handler: async (params, context) => {
      const { owner, repo, ...body } = params;
      return githubFetch(context.serviceConnectionId, `/repos/${owner}/${repo}/issues`, {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
  },
  {
    name: "github_update_issue",
    description: "Update an existing issue",
    action: "github:update_issue",
    inputSchema: z.object({
      owner: z.string(),
      repo: z.string(),
      issue_number: z.number(),
      title: z.string().optional(),
      body: z.string().optional(),
      state: z.enum(["open", "closed"]).optional(),
      labels: z.array(z.string()).optional(),
    }),
    handler: async (params, context) => {
      const { owner, repo, issue_number, ...body } = params;
      return githubFetch(context.serviceConnectionId, `/repos/${owner}/${repo}/issues/${issue_number}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
    },
  },
  {
    name: "github_list_pull_requests",
    description: "List pull requests for a repository",
    action: "github:list_pull_requests",
    inputSchema: z.object({
      owner: z.string(),
      repo: z.string(),
      state: z.enum(["open", "closed", "all"]).optional().default("open"),
      per_page: z.number().min(1).max(100).optional().default(30),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({
        state: (params.state as string) || "open",
        per_page: String(params.per_page ?? 30),
      });
      return githubFetch(context.serviceConnectionId, `/repos/${params.owner}/${params.repo}/pulls?${query.toString()}`);
    },
  },
  {
    name: "github_get_pull_request",
    description: "Get a specific pull request",
    action: "github:get_pull_request",
    inputSchema: z.object({
      owner: z.string(),
      repo: z.string(),
      pull_number: z.number(),
    }),
    handler: async (params, context) => {
      return githubFetch(context.serviceConnectionId, `/repos/${params.owner}/${params.repo}/pulls/${params.pull_number}`);
    },
  },
  {
    name: "github_create_pull_request",
    description: "Create a new pull request",
    action: "github:create_pull_request",
    inputSchema: z.object({
      owner: z.string(),
      repo: z.string(),
      title: z.string(),
      body: z.string().optional(),
      head: z.string().describe("Branch to merge from"),
      base: z.string().describe("Branch to merge into"),
    }),
    handler: async (params, context) => {
      const { owner, repo, ...body } = params;
      return githubFetch(context.serviceConnectionId, `/repos/${owner}/${repo}/pulls`, {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
  },
  {
    name: "github_list_commits",
    description: "List commits for a repository",
    action: "github:list_commits",
    inputSchema: z.object({
      owner: z.string(),
      repo: z.string(),
      sha: z.string().optional().describe("Branch name or commit SHA"),
      per_page: z.number().min(1).max(100).optional().default(30),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({ per_page: String(params.per_page ?? 30) });
      if (params.sha) query.set("sha", params.sha as string);
      return githubFetch(context.serviceConnectionId, `/repos/${params.owner}/${params.repo}/commits?${query.toString()}`);
    },
  },
  {
    name: "github_get_authenticated_user",
    description: "Get the authenticated GitHub user",
    action: "github:get_authenticated_user",
    inputSchema: z.object({}),
    handler: async (_params, context) => {
      return githubFetch(context.serviceConnectionId, "/user");
    },
  },
  {
    name: "github_search_repos",
    description: "Search GitHub repositories",
    action: "github:search_repos",
    inputSchema: z.object({
      query: z.string(),
      per_page: z.number().min(1).max(100).optional().default(10),
    }),
    handler: async (params, context) => {
      const q = new URLSearchParams({ q: params.query as string, per_page: String(params.per_page ?? 10) });
      return githubFetch(context.serviceConnectionId, `/search/repositories?${q.toString()}`);
    },
  },
  {
    name: "github_search_issues",
    description: "Search GitHub issues and pull requests",
    action: "github:search_issues",
    inputSchema: z.object({
      query: z.string(),
      per_page: z.number().min(1).max(100).optional().default(10),
    }),
    handler: async (params, context) => {
      const q = new URLSearchParams({ q: params.query as string, per_page: String(params.per_page ?? 10) });
      return githubFetch(context.serviceConnectionId, `/search/issues?${q.toString()}`);
    },
  },
];
