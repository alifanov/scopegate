export interface PermissionGroup {
  name: string;
  description: string;
  actions: string[];
}

export const PERMISSION_GROUPS: Record<string, PermissionGroup> = {
  gmail: {
    name: "Gmail",
    description: "Access to Gmail operations",
    actions: [
      "gmail:read_emails",
      "gmail:send_email",
      "gmail:list_labels",
      "gmail:search_emails",
    ],
  },
  calendar: {
    name: "Google Calendar",
    description: "Access to Google Calendar operations",
    actions: [
      "calendar:list_events",
      "calendar:create_event",
      "calendar:update_event",
      "calendar:delete_event",
    ],
  },
  drive: {
    name: "Google Drive",
    description: "Access to Google Drive operations",
    actions: [
      "drive:list_files",
      "drive:read_file",
      "drive:create_file",
      "drive:delete_file",
    ],
  },
};

export const ALL_ACTIONS = Object.values(PERMISSION_GROUPS).flatMap(
  (g) => g.actions
);

export function getActionGroup(action: string): string | null {
  for (const [key, group] of Object.entries(PERMISSION_GROUPS)) {
    if (group.actions.includes(action)) return key;
  }
  return null;
}
