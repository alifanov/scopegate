"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { PERMISSION_GROUPS } from "@/lib/mcp/permissions";

interface PermissionPickerProps {
  provider: string;
  value: Set<string>;
  onChange: (next: Set<string>) => void;
  /** Prefix for checkbox `id`s so two pickers can coexist in the DOM. */
  idPrefix: string;
}

/** Checkbox group for the actions of a single provider's permission group. */
export function PermissionPicker({
  provider,
  value,
  onChange,
  idPrefix,
}: PermissionPickerProps) {
  const group = PERMISSION_GROUPS[provider];
  if (!group) return null;

  function togglePermission(action: string) {
    const next = new Set(value);
    if (next.has(action)) next.delete(action);
    else next.add(action);
    onChange(next);
  }

  function toggleGroup() {
    const next = new Set(value);
    const allSelected = group.actions.every((a) => next.has(a));
    if (allSelected) group.actions.forEach((a) => next.delete(a));
    else group.actions.forEach((a) => next.add(a));
    onChange(next);
  }

  const allSelected = group.actions.every((a) => value.has(a));

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Checkbox
          id={`${idPrefix}-select-all`}
          checked={allSelected}
          onCheckedChange={toggleGroup}
        />
        <Label htmlFor={`${idPrefix}-select-all`} className="font-semibold">
          Select All
        </Label>
      </div>
      <div className="space-y-2">
        {group.actions.map((action) => (
          <div key={action} className="flex items-center space-x-2">
            <Checkbox
              id={`${idPrefix}-${action}`}
              checked={value.has(action)}
              onCheckedChange={() => togglePermission(action)}
            />
            <Label htmlFor={`${idPrefix}-${action}`} className="text-sm font-normal">
              {action}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}
