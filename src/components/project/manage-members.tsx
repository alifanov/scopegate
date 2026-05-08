"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UserPlus, X } from "lucide-react";
import { toast } from "sonner";

interface Member {
  id: string;
  role: string;
  user: { id: string; email: string; name: string | null };
}

interface ManageMembersProps {
  projectId: string;
  members: Member[];
  onChanged: () => void;
}

export function ManageMembers({
  projectId,
  members,
  onChanged,
}: ManageMembersProps) {
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success("Member added");
        setEmail("");
        onChanged();
      } else {
        toast.error(data.error || "Failed to add member");
      }
    } catch {
      toast.error("Failed to add member");
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(userId: string) {
    setRemovingId(userId);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/members/${userId}`,
        { method: "DELETE" }
      );
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success("Member removed");
        onChanged();
      } else {
        toast.error(data.error || "Failed to remove member");
      }
    } catch {
      toast.error("Failed to remove member");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          type="email"
          placeholder="user@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="flex-1"
        />
        <Button type="submit" disabled={adding} className="cursor-pointer shrink-0">
          <UserPlus className="size-4" />
          {adding ? "Adding..." : "Add"}
        </Button>
      </form>

      <div className="space-y-2">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between rounded-md border p-3"
          >
            <div>
              <p className="font-medium text-sm">
                {member.user.name || member.user.email}
              </p>
              <p className="text-xs text-muted-foreground">{member.user.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{member.role}</Badge>
              {member.role !== "owner" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 cursor-pointer text-muted-foreground hover:text-destructive"
                  disabled={removingId === member.user.id}
                  onClick={() => handleRemove(member.user.id)}
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
