"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Link2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface GenerateInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GenerateInviteDialog({
  open,
  onOpenChange,
}: GenerateInviteDialogProps) {
  const [loading, setLoading] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");
  const [copied, setCopied] = useState(false);

  function handleOpenChange(value: boolean) {
    onOpenChange(value);
    if (!value) {
      setInviteUrl("");
      setCopied(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    try {
      const res = await fetch("/api/admin/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email || undefined }),
      });

      if (res.ok) {
        const data = await res.json();
        setInviteUrl(data.inviteUrl);
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to generate invite link");
      }
    } catch {
      toast.error("Failed to generate invite link");
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard() {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    toast.success("Invite link copied");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Invite Link</DialogTitle>
          <DialogDescription>
            Create a one-time invite link valid for 7 days. Optionally restrict
            it to a specific email address.
          </DialogDescription>
        </DialogHeader>

        {!inviteUrl ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">
                Restrict to email{" "}
                <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="invite-email"
                name="email"
                type="email"
                placeholder="user@example.com"
              />
            </div>
            <Button
              type="submit"
              className="w-full cursor-pointer"
              disabled={loading}
            >
              <Link2 className="size-4" />
              {loading ? "Generating..." : "Generate Link"}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Invite Link</Label>
              <div className="flex gap-2">
                <Input value={inviteUrl} readOnly className="font-mono text-xs" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0 cursor-pointer"
                  onClick={copyToClipboard}
                >
                  {copied ? (
                    <Check className="size-4 text-green-600" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This link can only be used once and expires in 7 days.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full cursor-pointer"
              onClick={() => {
                setInviteUrl("");
                setCopied(false);
              }}
            >
              Generate Another
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
