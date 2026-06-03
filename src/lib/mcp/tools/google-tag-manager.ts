import { z } from 'zod';
import { googleTagManagerFetch } from '../google-tag-manager';
import type { ToolDefinition } from './types';

export const googleTagManagerTools: ToolDefinition[] = [
  // Google Tag Manager tools
  // Accounts
  {
    name: "googleTagManager_list_accounts",
    description: "List all Google Tag Manager accounts the user has access to",
    action: "googleTagManager:list_accounts",
    inputSchema: z.object({}),
    handler: async (_params, context) => {
      return googleTagManagerFetch(context.serviceConnectionId, "/accounts");
    },
  },
  {
    name: "googleTagManager_get_account",
    description: "Get details of a specific GTM account",
    action: "googleTagManager:get_account",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}`
      );
    },
  },
  {
    name: "googleTagManager_update_account",
    description: "Update a GTM account's settings",
    action: "googleTagManager:update_account",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      name: z.string().describe("New account name"),
      shareData: z.boolean().optional().describe("Whether to share data with Google anonymously"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}`,
        {
          method: "PUT",
          body: JSON.stringify({ name: params.name, shareData: params.shareData }),
        }
      );
    },
  },
  // Containers
  {
    name: "googleTagManager_list_containers",
    description: "List all containers in a GTM account",
    action: "googleTagManager:list_containers",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers`
      );
    },
  },
  {
    name: "googleTagManager_get_container",
    description: "Get details of a specific GTM container",
    action: "googleTagManager:get_container",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}`
      );
    },
  },
  {
    name: "googleTagManager_create_container",
    description: "Create a new GTM container in an account",
    action: "googleTagManager:create_container",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      name: z.string().describe("Container name"),
      usageContext: z.array(z.enum(["web", "androidSdk5", "iosSdk5", "amp", "server"])).describe("Usage contexts for the container"),
      domainName: z.array(z.string()).optional().describe("List of domain names associated with the container"),
      notes: z.string().optional().describe("Optional notes about the container"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers`,
        {
          method: "POST",
          body: JSON.stringify({
            name: params.name,
            usageContext: params.usageContext,
            domainName: params.domainName,
            notes: params.notes,
          }),
        }
      );
    },
  },
  {
    name: "googleTagManager_update_container",
    description: "Update a GTM container's settings",
    action: "googleTagManager:update_container",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      name: z.string().describe("Container name"),
      usageContext: z.array(z.enum(["web", "androidSdk5", "iosSdk5", "amp", "server"])).describe("Usage contexts for the container"),
      domainName: z.array(z.string()).optional().describe("List of domain names"),
      notes: z.string().optional().describe("Optional notes"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            name: params.name,
            usageContext: params.usageContext,
            domainName: params.domainName,
            notes: params.notes,
          }),
        }
      );
    },
  },
  {
    name: "googleTagManager_delete_container",
    description: "Delete a GTM container",
    action: "googleTagManager:delete_container",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}`,
        { method: "DELETE" }
      );
    },
  },
  {
    name: "googleTagManager_get_container_snippet",
    description: "Get the GTM JavaScript snippet code for a container",
    action: "googleTagManager:get_container_snippet",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}:snippet`
      );
    },
  },
  // Workspaces
  {
    name: "googleTagManager_list_workspaces",
    description: "List all workspaces in a GTM container",
    action: "googleTagManager:list_workspaces",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces`
      );
    },
  },
  {
    name: "googleTagManager_get_workspace",
    description: "Get details of a specific GTM workspace",
    action: "googleTagManager:get_workspace",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}`
      );
    },
  },
  {
    name: "googleTagManager_create_workspace",
    description: "Create a new workspace in a GTM container",
    action: "googleTagManager:create_workspace",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      name: z.string().describe("Workspace name"),
      description: z.string().optional().describe("Workspace description"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces`,
        {
          method: "POST",
          body: JSON.stringify({ name: params.name, description: params.description }),
        }
      );
    },
  },
  {
    name: "googleTagManager_update_workspace",
    description: "Update a GTM workspace's name or description",
    action: "googleTagManager:update_workspace",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
      name: z.string().describe("Workspace name"),
      description: z.string().optional().describe("Workspace description"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}`,
        {
          method: "PUT",
          body: JSON.stringify({ name: params.name, description: params.description }),
        }
      );
    },
  },
  {
    name: "googleTagManager_delete_workspace",
    description: "Delete a GTM workspace",
    action: "googleTagManager:delete_workspace",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}`,
        { method: "DELETE" }
      );
    },
  },
  {
    name: "googleTagManager_get_workspace_status",
    description: "Get the current status of a GTM workspace — lists modified entities and merge conflicts",
    action: "googleTagManager:get_workspace_status",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}:getStatus`
      );
    },
  },
  {
    name: "googleTagManager_quick_preview_workspace",
    description: "Create a quick preview of a GTM workspace for debugging and testing",
    action: "googleTagManager:quick_preview_workspace",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}:quick_preview`,
        { method: "POST" }
      );
    },
  },
  {
    name: "googleTagManager_sync_workspace",
    description: "Sync a GTM workspace to the latest container version",
    action: "googleTagManager:sync_workspace",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}:sync`,
        { method: "POST" }
      );
    },
  },
  {
    name: "googleTagManager_resolve_workspace_conflict",
    description: "Resolve a merge conflict in a GTM workspace by accepting the workspace or container version entity",
    action: "googleTagManager:resolve_workspace_conflict",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
      entity: z.record(z.string(), z.unknown()).describe("The entity to resolve the conflict with (workspace or container version entity)"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}:resolve_conflict`,
        {
          method: "POST",
          body: JSON.stringify({ entity: params.entity }),
        }
      );
    },
  },
  {
    name: "googleTagManager_create_version_from_workspace",
    description: "Create a new container version from a GTM workspace",
    action: "googleTagManager:create_version_from_workspace",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
      name: z.string().optional().describe("Version name"),
      notes: z.string().optional().describe("Version notes"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}:create_version`,
        {
          method: "POST",
          body: JSON.stringify({ name: params.name, notes: params.notes }),
        }
      );
    },
  },
  // Tags
  {
    name: "googleTagManager_list_tags",
    description: "List all tags in a GTM workspace",
    action: "googleTagManager:list_tags",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/tags`
      );
    },
  },
  {
    name: "googleTagManager_get_tag",
    description: "Get details of a specific tag in a GTM workspace",
    action: "googleTagManager:get_tag",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
      tagId: z.string().describe("The GTM tag ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/tags/${params.tagId}`
      );
    },
  },
  {
    name: "googleTagManager_create_tag",
    description: "Create a new tag in a GTM workspace",
    action: "googleTagManager:create_tag",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
      name: z.string().describe("Tag name"),
      type: z.string().describe("Tag type (e.g. 'ua', 'ga4', 'html', 'img')"),
      parameter: z.array(z.record(z.string(), z.unknown())).optional().describe("Tag parameters as GTM Parameter objects"),
      firingTriggerId: z.array(z.string()).optional().describe("Firing trigger IDs"),
      blockingTriggerId: z.array(z.string()).optional().describe("Blocking trigger IDs"),
      notes: z.string().optional().describe("Notes about the tag"),
      tagFiringOption: z.enum(["oncePerEvent", "oncePerLoad", "unlimited"]).optional().describe("Tag firing option"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/tags`,
        {
          method: "POST",
          body: JSON.stringify({
            name: params.name,
            type: params.type,
            parameter: params.parameter,
            firingTriggerId: params.firingTriggerId,
            blockingTriggerId: params.blockingTriggerId,
            notes: params.notes,
            tagFiringOption: params.tagFiringOption,
          }),
        }
      );
    },
  },
  {
    name: "googleTagManager_update_tag",
    description: "Update an existing tag in a GTM workspace",
    action: "googleTagManager:update_tag",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
      tagId: z.string().describe("The GTM tag ID"),
      name: z.string().describe("Tag name"),
      type: z.string().describe("Tag type"),
      parameter: z.array(z.record(z.string(), z.unknown())).optional().describe("Tag parameters as GTM Parameter objects"),
      firingTriggerId: z.array(z.string()).optional().describe("Firing trigger IDs"),
      blockingTriggerId: z.array(z.string()).optional().describe("Blocking trigger IDs"),
      notes: z.string().optional().describe("Notes about the tag"),
      tagFiringOption: z.enum(["oncePerEvent", "oncePerLoad", "unlimited"]).optional().describe("Tag firing option"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/tags/${params.tagId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            name: params.name,
            type: params.type,
            parameter: params.parameter,
            firingTriggerId: params.firingTriggerId,
            blockingTriggerId: params.blockingTriggerId,
            notes: params.notes,
            tagFiringOption: params.tagFiringOption,
          }),
        }
      );
    },
  },
  {
    name: "googleTagManager_delete_tag",
    description: "Delete a tag from a GTM workspace",
    action: "googleTagManager:delete_tag",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
      tagId: z.string().describe("The GTM tag ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/tags/${params.tagId}`,
        { method: "DELETE" }
      );
    },
  },
  {
    name: "googleTagManager_revert_tag",
    description: "Revert changes to a tag in a GTM workspace to the last synced state",
    action: "googleTagManager:revert_tag",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
      tagId: z.string().describe("The GTM tag ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/tags/${params.tagId}:revert`,
        { method: "POST" }
      );
    },
  },
  // Triggers
  {
    name: "googleTagManager_list_triggers",
    description: "List all triggers in a GTM workspace",
    action: "googleTagManager:list_triggers",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/triggers`
      );
    },
  },
  {
    name: "googleTagManager_get_trigger",
    description: "Get details of a specific trigger in a GTM workspace",
    action: "googleTagManager:get_trigger",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
      triggerId: z.string().describe("The GTM trigger ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/triggers/${params.triggerId}`
      );
    },
  },
  {
    name: "googleTagManager_create_trigger",
    description: "Create a new trigger in a GTM workspace",
    action: "googleTagManager:create_trigger",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
      name: z.string().describe("Trigger name"),
      type: z.string().describe("Trigger type (e.g. 'pageview', 'click', 'customEvent', 'domReady', 'windowLoaded')"),
      filter: z.array(z.record(z.string(), z.unknown())).optional().describe("Trigger filters as GTM Condition objects"),
      autoEventFilter: z.array(z.record(z.string(), z.unknown())).optional().describe("Auto event filters"),
      customEventFilter: z.array(z.record(z.string(), z.unknown())).optional().describe("Custom event filters (for customEvent type)"),
      notes: z.string().optional().describe("Notes about the trigger"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/triggers`,
        {
          method: "POST",
          body: JSON.stringify({
            name: params.name,
            type: params.type,
            filter: params.filter,
            autoEventFilter: params.autoEventFilter,
            customEventFilter: params.customEventFilter,
            notes: params.notes,
          }),
        }
      );
    },
  },
  {
    name: "googleTagManager_update_trigger",
    description: "Update an existing trigger in a GTM workspace",
    action: "googleTagManager:update_trigger",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
      triggerId: z.string().describe("The GTM trigger ID"),
      name: z.string().describe("Trigger name"),
      type: z.string().describe("Trigger type"),
      filter: z.array(z.record(z.string(), z.unknown())).optional().describe("Trigger filters as GTM Condition objects"),
      notes: z.string().optional().describe("Notes about the trigger"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/triggers/${params.triggerId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            name: params.name,
            type: params.type,
            filter: params.filter,
            notes: params.notes,
          }),
        }
      );
    },
  },
  {
    name: "googleTagManager_delete_trigger",
    description: "Delete a trigger from a GTM workspace",
    action: "googleTagManager:delete_trigger",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
      triggerId: z.string().describe("The GTM trigger ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/triggers/${params.triggerId}`,
        { method: "DELETE" }
      );
    },
  },
  {
    name: "googleTagManager_revert_trigger",
    description: "Revert changes to a trigger in a GTM workspace to the last synced state",
    action: "googleTagManager:revert_trigger",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
      triggerId: z.string().describe("The GTM trigger ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/triggers/${params.triggerId}:revert`,
        { method: "POST" }
      );
    },
  },
  // Variables
  {
    name: "googleTagManager_list_variables",
    description: "List all variables in a GTM workspace",
    action: "googleTagManager:list_variables",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/variables`
      );
    },
  },
  {
    name: "googleTagManager_get_variable",
    description: "Get details of a specific variable in a GTM workspace",
    action: "googleTagManager:get_variable",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
      variableId: z.string().describe("The GTM variable ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/variables/${params.variableId}`
      );
    },
  },
  {
    name: "googleTagManager_create_variable",
    description: "Create a new variable in a GTM workspace",
    action: "googleTagManager:create_variable",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
      name: z.string().describe("Variable name"),
      type: z.string().describe("Variable type (e.g. 'v' for Data Layer, 'u' for URL, 'k' for 1st-party cookie, 'jsm' for custom JS)"),
      parameter: z.array(z.record(z.string(), z.unknown())).optional().describe("Variable parameters as GTM Parameter objects"),
      notes: z.string().optional().describe("Notes about the variable"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/variables`,
        {
          method: "POST",
          body: JSON.stringify({
            name: params.name,
            type: params.type,
            parameter: params.parameter,
            notes: params.notes,
          }),
        }
      );
    },
  },
  {
    name: "googleTagManager_update_variable",
    description: "Update an existing variable in a GTM workspace",
    action: "googleTagManager:update_variable",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
      variableId: z.string().describe("The GTM variable ID"),
      name: z.string().describe("Variable name"),
      type: z.string().describe("Variable type"),
      parameter: z.array(z.record(z.string(), z.unknown())).optional().describe("Variable parameters as GTM Parameter objects"),
      notes: z.string().optional().describe("Notes about the variable"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/variables/${params.variableId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            name: params.name,
            type: params.type,
            parameter: params.parameter,
            notes: params.notes,
          }),
        }
      );
    },
  },
  {
    name: "googleTagManager_delete_variable",
    description: "Delete a variable from a GTM workspace",
    action: "googleTagManager:delete_variable",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
      variableId: z.string().describe("The GTM variable ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/variables/${params.variableId}`,
        { method: "DELETE" }
      );
    },
  },
  {
    name: "googleTagManager_revert_variable",
    description: "Revert changes to a variable in a GTM workspace to the last synced state",
    action: "googleTagManager:revert_variable",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
      variableId: z.string().describe("The GTM variable ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/variables/${params.variableId}:revert`,
        { method: "POST" }
      );
    },
  },
  // Built-in Variables
  {
    name: "googleTagManager_list_built_in_variables",
    description: "List all enabled built-in variables in a GTM workspace",
    action: "googleTagManager:list_built_in_variables",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/built_in_variables`
      );
    },
  },
  {
    name: "googleTagManager_enable_built_in_variables",
    description: "Enable one or more built-in variables in a GTM workspace",
    action: "googleTagManager:enable_built_in_variables",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
      type: z.array(z.string()).describe("Built-in variable types to enable (e.g. ['pageUrl', 'clickText', 'formId'])"),
    }),
    handler: async (params, context) => {
      const typeParams = (params.type as string[]).map((t) => `type=${encodeURIComponent(t)}`).join("&");
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/built_in_variables?${typeParams}`,
        { method: "POST" }
      );
    },
  },
  {
    name: "googleTagManager_disable_built_in_variables",
    description: "Disable one or more built-in variables in a GTM workspace",
    action: "googleTagManager:disable_built_in_variables",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
      type: z.array(z.string()).describe("Built-in variable types to disable"),
    }),
    handler: async (params, context) => {
      const typeParams = (params.type as string[]).map((t) => `type=${encodeURIComponent(t)}`).join("&");
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/built_in_variables?${typeParams}`,
        { method: "DELETE" }
      );
    },
  },
  {
    name: "googleTagManager_revert_built_in_variable",
    description: "Revert changes to a built-in variable in a GTM workspace",
    action: "googleTagManager:revert_built_in_variable",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
      type: z.string().describe("Built-in variable type to revert"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/built_in_variables:revert?type=${encodeURIComponent(params.type as string)}`,
        { method: "POST" }
      );
    },
  },
  // Folders
  {
    name: "googleTagManager_list_folders",
    description: "List all folders in a GTM workspace",
    action: "googleTagManager:list_folders",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/folders`
      );
    },
  },
  {
    name: "googleTagManager_get_folder",
    description: "Get details of a specific folder in a GTM workspace",
    action: "googleTagManager:get_folder",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
      folderId: z.string().describe("The GTM folder ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/folders/${params.folderId}`
      );
    },
  },
  {
    name: "googleTagManager_create_folder",
    description: "Create a new folder in a GTM workspace",
    action: "googleTagManager:create_folder",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
      name: z.string().describe("Folder name"),
      notes: z.string().optional().describe("Notes about the folder"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/folders`,
        {
          method: "POST",
          body: JSON.stringify({ name: params.name, notes: params.notes }),
        }
      );
    },
  },
  {
    name: "googleTagManager_update_folder",
    description: "Update a folder in a GTM workspace",
    action: "googleTagManager:update_folder",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
      folderId: z.string().describe("The GTM folder ID"),
      name: z.string().describe("Folder name"),
      notes: z.string().optional().describe("Notes about the folder"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/folders/${params.folderId}`,
        {
          method: "PUT",
          body: JSON.stringify({ name: params.name, notes: params.notes }),
        }
      );
    },
  },
  {
    name: "googleTagManager_delete_folder",
    description: "Delete a folder from a GTM workspace",
    action: "googleTagManager:delete_folder",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
      folderId: z.string().describe("The GTM folder ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/folders/${params.folderId}`,
        { method: "DELETE" }
      );
    },
  },
  {
    name: "googleTagManager_get_folder_entities",
    description: "List all entities (tags, triggers, variables) in a GTM folder",
    action: "googleTagManager:get_folder_entities",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
      folderId: z.string().describe("The GTM folder ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/folders/${params.folderId}:entities`
      );
    },
  },
  {
    name: "googleTagManager_move_entities_to_folder",
    description: "Move tags, triggers, and variables into a GTM folder",
    action: "googleTagManager:move_entities_to_folder",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
      folderId: z.string().describe("The GTM folder ID"),
      tagId: z.array(z.string()).optional().describe("Tag IDs to move"),
      triggerId: z.array(z.string()).optional().describe("Trigger IDs to move"),
      variableId: z.array(z.string()).optional().describe("Variable IDs to move"),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams();
      if (params.tagId) (params.tagId as string[]).forEach((id) => query.append("tagId", id));
      if (params.triggerId) (params.triggerId as string[]).forEach((id) => query.append("triggerId", id));
      if (params.variableId) (params.variableId as string[]).forEach((id) => query.append("variableId", id));
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/folders/${params.folderId}:move_entities_to_folder?${query.toString()}`,
        { method: "POST" }
      );
    },
  },
  // Versions
  {
    name: "googleTagManager_list_version_headers",
    description: "List all container version headers (metadata) in a GTM container",
    action: "googleTagManager:list_version_headers",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      includeDeleted: z.boolean().optional().describe("Include deleted versions"),
    }),
    handler: async (params, context) => {
      const query = params.includeDeleted ? "?includeDeleted=true" : "";
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/version_headers${query}`
      );
    },
  },
  {
    name: "googleTagManager_get_latest_version_header",
    description: "Get the latest container version header in a GTM container",
    action: "googleTagManager:get_latest_version_header",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/version_headers:latest`
      );
    },
  },
  {
    name: "googleTagManager_get_version",
    description: "Get full details of a specific GTM container version",
    action: "googleTagManager:get_version",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      containerVersionId: z.string().describe("The container version ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/versions/${params.containerVersionId}`
      );
    },
  },
  {
    name: "googleTagManager_get_live_version",
    description: "Get the currently published (live) version of a GTM container",
    action: "googleTagManager:get_live_version",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/versions:live`
      );
    },
  },
  {
    name: "googleTagManager_update_version",
    description: "Update the name or notes of a GTM container version",
    action: "googleTagManager:update_version",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      containerVersionId: z.string().describe("The container version ID"),
      name: z.string().optional().describe("Version name"),
      notes: z.string().optional().describe("Version notes"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/versions/${params.containerVersionId}`,
        {
          method: "PUT",
          body: JSON.stringify({ name: params.name, notes: params.notes }),
        }
      );
    },
  },
  {
    name: "googleTagManager_delete_version",
    description: "Delete a GTM container version",
    action: "googleTagManager:delete_version",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      containerVersionId: z.string().describe("The container version ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/versions/${params.containerVersionId}`,
        { method: "DELETE" }
      );
    },
  },
  {
    name: "googleTagManager_undelete_version",
    description: "Undelete a previously deleted GTM container version",
    action: "googleTagManager:undelete_version",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      containerVersionId: z.string().describe("The container version ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/versions/${params.containerVersionId}:undelete`,
        { method: "POST" }
      );
    },
  },
  {
    name: "googleTagManager_publish_version",
    description: "Publish a GTM container version live",
    action: "googleTagManager:publish_version",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      containerVersionId: z.string().describe("The container version ID to publish"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/versions/${params.containerVersionId}:publish`,
        { method: "POST" }
      );
    },
  },
  {
    name: "googleTagManager_set_latest_version",
    description: "Set a GTM container version as the latest version (without publishing)",
    action: "googleTagManager:set_latest_version",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      containerVersionId: z.string().describe("The container version ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/versions/${params.containerVersionId}:set_latest`,
        { method: "POST" }
      );
    },
  },
  // Environments
  {
    name: "googleTagManager_list_environments",
    description: "List all environments in a GTM container",
    action: "googleTagManager:list_environments",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/environments`
      );
    },
  },
  {
    name: "googleTagManager_get_environment",
    description: "Get details of a specific GTM environment",
    action: "googleTagManager:get_environment",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      environmentId: z.string().describe("The GTM environment ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/environments/${params.environmentId}`
      );
    },
  },
  {
    name: "googleTagManager_create_environment",
    description: "Create a new custom environment in a GTM container",
    action: "googleTagManager:create_environment",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      name: z.string().describe("Environment name"),
      description: z.string().optional().describe("Environment description"),
      url: z.string().optional().describe("Default preview URL for this environment"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/environments`,
        {
          method: "POST",
          body: JSON.stringify({
            name: params.name,
            description: params.description,
            url: params.url,
            type: "user",
          }),
        }
      );
    },
  },
  {
    name: "googleTagManager_update_environment",
    description: "Update a GTM environment",
    action: "googleTagManager:update_environment",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      environmentId: z.string().describe("The GTM environment ID"),
      name: z.string().optional().describe("Environment name"),
      description: z.string().optional().describe("Environment description"),
      url: z.string().optional().describe("Default preview URL"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/environments/${params.environmentId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            name: params.name,
            description: params.description,
            url: params.url,
          }),
        }
      );
    },
  },
  {
    name: "googleTagManager_delete_environment",
    description: "Delete a GTM environment",
    action: "googleTagManager:delete_environment",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      environmentId: z.string().describe("The GTM environment ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/environments/${params.environmentId}`,
        { method: "DELETE" }
      );
    },
  },
  {
    name: "googleTagManager_reauthorize_environment",
    description: "Regenerate the authorization token for a GTM environment",
    action: "googleTagManager:reauthorize_environment",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      environmentId: z.string().describe("The GTM environment ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/environments/${params.environmentId}:reauthorize`,
        { method: "POST" }
      );
    },
  },
  // User Permissions
  {
    name: "googleTagManager_list_user_permissions",
    description: "List all user permissions for a GTM account",
    action: "googleTagManager:list_user_permissions",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/user_permissions`
      );
    },
  },
  {
    name: "googleTagManager_get_user_permission",
    description: "Get permission details for a specific user in a GTM account",
    action: "googleTagManager:get_user_permission",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      userPermissionId: z.string().describe("The user permission ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/user_permissions/${params.userPermissionId}`
      );
    },
  },
  {
    name: "googleTagManager_create_user_permission",
    description: "Grant a user access to a GTM account",
    action: "googleTagManager:create_user_permission",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      emailAddress: z.string().describe("Email address of the user to grant access"),
      accountAccess: z.object({
        permission: z.enum(["noAccess", "user", "admin"]).describe("Account-level permission"),
      }).describe("Account-level access settings"),
      containerAccess: z.array(z.object({
        containerId: z.string(),
        permission: z.enum(["noAccess", "read", "edit", "approve", "publish"]),
      })).optional().describe("Container-level access settings"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/user_permissions`,
        {
          method: "POST",
          body: JSON.stringify({
            emailAddress: params.emailAddress,
            accountAccess: params.accountAccess,
            containerAccess: params.containerAccess,
          }),
        }
      );
    },
  },
  {
    name: "googleTagManager_update_user_permission",
    description: "Update a user's permissions in a GTM account",
    action: "googleTagManager:update_user_permission",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      userPermissionId: z.string().describe("The user permission ID"),
      accountAccess: z.object({
        permission: z.enum(["noAccess", "user", "admin"]).describe("Account-level permission"),
      }).describe("Account-level access settings"),
      containerAccess: z.array(z.object({
        containerId: z.string(),
        permission: z.enum(["noAccess", "read", "edit", "approve", "publish"]),
      })).optional().describe("Container-level access settings"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/user_permissions/${params.userPermissionId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            accountAccess: params.accountAccess,
            containerAccess: params.containerAccess,
          }),
        }
      );
    },
  },
  {
    name: "googleTagManager_delete_user_permission",
    description: "Revoke a user's access from a GTM account",
    action: "googleTagManager:delete_user_permission",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      userPermissionId: z.string().describe("The user permission ID to revoke"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/user_permissions/${params.userPermissionId}`,
        { method: "DELETE" }
      );
    },
  },
];
