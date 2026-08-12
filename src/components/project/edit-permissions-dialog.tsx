"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PermissionPicker } from "@/components/project/permission-picker";
import { Shield } from "lucide-react";
import { toast } from "sonner";
import { apiSend, ApiError } from "@/lib/api-client";

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

  async function handleSave() {
    setSaving(true);
    try {
      await apiSend(`/api/projects/${projectId}/endpoints/${endpointId}`, "PATCH", {
        permissions: Array.from(selectedPermissions),
      });
      toast.success("Permissions updated");
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update permissions");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Permissions</DialogTitle>
        </DialogHeader>

        <PermissionPicker
          provider={serviceProvider}
          value={selectedPermissions}
          onChange={setSelectedPermissions}
          idPrefix="edit"
        />

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
