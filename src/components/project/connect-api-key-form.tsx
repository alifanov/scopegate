"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { apiSend, ApiError } from "@/lib/api-client";
import { API_KEY_HELP, API_KEY_PLACEHOLDERS } from "@/components/project/connect-provider-copy";

interface ConnectApiKeyFormProps {
  projectId: string;
  provider: string;
  onBack: () => void;
  onConnected: () => void;
}

export function ConnectApiKeyForm({ projectId, provider, onBack, onConnected }: ConnectApiKeyFormProps) {
  const [value, setValue] = useState("");
  const [label, setLabel] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;

    setSubmitting(true);
    try {
      await apiSend(`/api/projects/${projectId}/services/connect-api-key`, "POST", {
        provider,
        apiKey: value.trim(),
        label: label.trim() || undefined,
      });
      toast.success("Service connected successfully.");
      onConnected();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to connect service.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-3" />
        Back to services
      </button>

      {API_KEY_HELP[provider] && (
        <p className="text-sm text-muted-foreground bg-muted rounded-md p-3">{API_KEY_HELP[provider]}</p>
      )}

      <div className="space-y-2">
        <Label htmlFor="api-key">API Key</Label>
        <Input
          id="api-key"
          type="password"
          placeholder={API_KEY_PLACEHOLDERS[provider] ?? "API key"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="api-key-label">Label (optional)</Label>
        <Input
          id="api-key-label"
          type="text"
          placeholder="e.g. Production Key"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
      </div>

      <Button type="submit" className="w-full" disabled={submitting || !value.trim()}>
        {submitting ? "Validating..." : "Connect"}
      </Button>
    </form>
  );
}
