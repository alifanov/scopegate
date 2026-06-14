import { PROVIDER_REGISTRY } from "@/lib/provider-registry";

export interface PermissionGroup {
  name: string;
  description: string;
  actions: string[];
}

export const PERMISSION_GROUPS: Record<string, PermissionGroup> = Object.fromEntries(
  PROVIDER_REGISTRY.map((p) => [
    p.key,
    { name: p.displayName, description: p.description, actions: p.actions },
  ])
);

export const ALL_ACTIONS = Object.values(PERMISSION_GROUPS).flatMap((g) => g.actions);

export function getActionGroup(action: string): string | null {
  for (const [key, group] of Object.entries(PERMISSION_GROUPS)) {
    if (group.actions.includes(action)) return key;
  }
  return null;
}
