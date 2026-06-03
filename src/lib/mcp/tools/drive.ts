import { z } from 'zod';
import type { ToolDefinition } from './types';

export const driveTools: ToolDefinition[] = [
  // Drive tools
  {
    name: "drive_list_files",
    description: "List files in Google Drive",
    action: "drive:list_files",
    inputSchema: z.object({
      query: z.string().optional(),
      maxResults: z.number().optional().default(10),
    }),
    handler: async (params) => {
      return { files: [], note: "Drive API not yet connected", params };
    },
  },
  {
    name: "drive_read_file",
    description: "Read contents of a Google Drive file",
    action: "drive:read_file",
    inputSchema: z.object({
      fileId: z.string(),
    }),
    handler: async (params) => {
      return { content: null, note: "Drive API not yet connected", params };
    },
  },
  {
    name: "drive_create_file",
    description: "Create a new file in Google Drive",
    action: "drive:create_file",
    inputSchema: z.object({
      name: z.string(),
      content: z.string(),
      mimeType: z.string().optional(),
    }),
    handler: async (params) => {
      return { success: false, note: "Drive API not yet connected", params };
    },
  },
  {
    name: "drive_delete_file",
    description: "Delete a file from Google Drive",
    action: "drive:delete_file",
    inputSchema: z.object({
      fileId: z.string(),
    }),
    handler: async (params) => {
      return { success: false, note: "Drive API not yet connected", params };
    },
  },
];
