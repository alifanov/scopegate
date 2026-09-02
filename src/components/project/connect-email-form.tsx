"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { apiSend, ApiError } from "@/lib/api-client";

interface ConnectEmailFormProps {
  projectId: string;
  onBack: () => void;
  onConnected: () => void;
}

export function ConnectEmailForm({ projectId, onBack, onConnected }: ConnectEmailFormProps) {
  const [form, setForm] = useState({
    email: "",
    password: "",
    imapHost: "",
    imapPort: "993",
    smtpHost: "",
    smtpPort: "465",
  });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email || !form.password || !form.imapHost || !form.smtpHost) return;

    setSubmitting(true);
    try {
      await apiSend(`/api/projects/${projectId}/services/connect-email`, "POST", {
        email: form.email.trim(),
        password: form.password,
        imapHost: form.imapHost.trim(),
        imapPort: parseInt(form.imapPort) || 993,
        smtpHost: form.smtpHost.trim(),
        smtpPort: parseInt(form.smtpPort) || 465,
      });
      toast.success("Email connected successfully.");
      onConnected();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to connect email.");
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

      <div className="space-y-2">
        <Label htmlFor="email-address">Email Address</Label>
        <Input
          id="email-address"
          type="email"
          placeholder="you@yourdomain.com"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          required
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email-password">Password</Label>
        <Input
          id="email-password"
          type="password"
          placeholder="Email password or app password"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="imap-host">IMAP Host</Label>
          <Input
            id="imap-host"
            type="text"
            placeholder="imap.yourdomain.com"
            value={form.imapHost}
            onChange={(e) => setForm((f) => ({ ...f, imapHost: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="imap-port">IMAP Port</Label>
          <Input
            id="imap-port"
            type="number"
            placeholder="993"
            value={form.imapPort}
            onChange={(e) => setForm((f) => ({ ...f, imapPort: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="smtp-host">SMTP Host</Label>
          <Input
            id="smtp-host"
            type="text"
            placeholder="smtp.yourdomain.com"
            value={form.smtpHost}
            onChange={(e) => setForm((f) => ({ ...f, smtpHost: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="smtp-port">SMTP Port</Label>
          <Input
            id="smtp-port"
            type="number"
            placeholder="465"
            value={form.smtpPort}
            onChange={(e) => setForm((f) => ({ ...f, smtpPort: e.target.value }))}
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={submitting || !form.email || !form.password || !form.imapHost || !form.smtpHost}
      >
        {submitting ? "Connecting..." : "Connect"}
      </Button>
    </form>
  );
}
