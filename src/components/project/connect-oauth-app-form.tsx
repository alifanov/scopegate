"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { apiSend, ApiError } from "@/lib/api-client";
import { getConnectTarget, getCredentialGroup } from "@/lib/provider-registry";
import { OAUTH_APP_SETUP } from "@/components/project/connect-provider-copy";

interface ConnectOAuthAppFormProps {
  projectId: string;
  provider: string;
  cloud: boolean;
  redirectUri: string;
  onBack: () => void;
  /** Called once credentials are saved and there is nothing left to redirect
   * to (the normal case is a redirect straight to the provider's consent
   * screen, handled inside this component). */
  onSaved: () => void;
}

export function ConnectOAuthAppForm({
  projectId,
  provider,
  cloud,
  redirectUri,
  onBack,
  onSaved,
}: ConnectOAuthAppFormProps) {
  const [form, setForm] = useState({ clientId: "", clientSecret: "" });
  const [submitting, setSubmitting] = useState(false);

  const group = getCredentialGroup(provider);
  const setup = group ? OAUTH_APP_SETUP[group] : undefined;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!group) return;

    setSubmitting(true);
    try {
      await apiSend(`/api/projects/${projectId}/oauth-apps`, "POST", {
        appGroup: group,
        clientId: form.clientId,
        clientSecret: form.clientSecret,
      });
      // Straight on to the provider consent screen — the credentials were only
      // ever a prerequisite for this redirect, so do not make the user find the
      // Connect button again.
      const target = getConnectTarget(provider, projectId, { cloud, hasOwnApp: true });
      if (target.kind === "redirect") {
        window.location.href = target.url;
        return;
      }
      onSaved();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save credentials.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="flex cursor-pointer items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-3" />
        Back to services
      </button>

      <div className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
        Register an OAuth application with the provider, then paste its
        credentials here. Add the redirect URI below to the app first —
        without it the provider rejects the sign-in with
        <code className="mx-1">redirect_uri_mismatch</code>.
      </div>

      <div className="space-y-2">
        <Label>Redirect URI (add this to your app)</Label>
        <div className="flex gap-2">
          <Input readOnly value={redirectUri} className="font-mono text-xs" />
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            onClick={() => {
              navigator.clipboard.writeText(redirectUri);
              toast.success("Redirect URI copied.");
            }}
          >
            Copy
          </Button>
        </div>
      </div>

      {setup ? (
        <div className="space-y-2">
          <Label>How to get these credentials</Label>
          <ol className="list-decimal space-y-1.5 rounded-md border p-3 pl-8 text-sm text-muted-foreground">
            {setup.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <a
            href={setup.console}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-sm text-primary underline underline-offset-4"
          >
            Open {setup.consoleLabel} →
          </a>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="oauth-client-id">Client ID</Label>
        <Input
          id="oauth-client-id"
          value={form.clientId}
          onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}
          required
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="oauth-client-secret">Client Secret</Label>
        <Input
          id="oauth-client-secret"
          type="password"
          value={form.clientSecret}
          onChange={(e) => setForm((f) => ({ ...f, clientSecret: e.target.value }))}
          required
        />
      </div>

      <Button type="submit" className="w-full cursor-pointer" disabled={submitting}>
        {submitting ? "Saving…" : "Save and continue"}
      </Button>
    </form>
  );
}
