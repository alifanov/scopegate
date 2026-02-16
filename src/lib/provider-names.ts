import { PERMISSION_GROUPS } from "@/lib/mcp/permissions";

export function getProviderDisplayName(key: string): string {
  if (PERMISSION_GROUPS[key]) {
    return PERMISSION_GROUPS[key].name;
  }
  // Fallback: capitalize first letter
  return key.charAt(0).toUpperCase() + key.slice(1);
}
