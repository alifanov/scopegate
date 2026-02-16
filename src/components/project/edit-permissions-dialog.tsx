"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PERMISSION_GROUPS } from "@/lib/mcp/permissions";
import { Shield } from "lucide-react";
import { toast } from "sonner";

interface EditPermissionsDialogProps {
  projectId: string;
  endpointId: string;
  currentPermissions: string[];
  serviceProvider: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function EditPermissionsDialog({
  projectId,
  endpointId,
  currentPermissions,
  serviceProvider,
  open,
  onOpenChange,
  onSaved,
}: EditPermissionsDialogProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set(currentPermissions)
  );
  const [saving, setSaving] = useState(false);

  // Reset when dialog opens
  function handleOpenChange(isOpen: boolean) {
    if (isOpen) {
      setSelectedPermissions(new Set(currentPermissions));
    }
    onOpenChange(isOpen);
  }

  function togglePermission(action: string) {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(action)) next.delete(action);
      else next.add(action);
      return next;
    });
  }

  function toggleGroup(actions: string[]) {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      const allSelected = actions.every((a) => next.has(a));
      if (allSelected) actions.forEach((a) => next.delete(a));
      else actions.forEach((a) => next.add(a));
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/endpoints/${endpointId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            permissions: Array.from(selectedPermissions),
          }),
        }
      );
      if (res.ok) {
        toast.success("Permissions updated");
        onOpenChange(false);
        onSaved();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to update permissions");
      }
    } catch {
      toast.error("Failed to update permissions");
    } finally {
      setSaving(false);
    }
  }

  const group = PERMISSION_GROUPS[serviceProvider];
  if (!group) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Permissions</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`edit-group-${serviceProvider}`}
              checked={group.actions.every((a) =>
                selectedPermissions.has(a)
              )}
              onCheckedChange={() => toggleGroup(group.actions)}
            />
            <Label
              htmlFor={`edit-group-${serviceProvider}`}
              className="font-semibold"
            >
              {group.name}
            </Label>
          </div>
          <div className="ml-6 space-y-2">
            {group.actions.map((action) => (
              <div key={action} className="flex items-center space-x-2">
                <Checkbox
                  id={`edit-${action}`}
                  checked={selectedPermissions.has(action)}
                  onCheckedChange={() => togglePermission(action)}
                />
                <Label
                  htmlFor={`edit-${action}`}
                  className="text-sm font-normal"
                >
                  {action}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || selectedPermissions.size === 0}
          >
            <Shield className="size-4" />
            {saving ? "Saving..." : "Save Permissions"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
