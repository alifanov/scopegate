import { useCallback, useEffect, useState } from "react";
import { apiGet, ApiError } from "@/lib/api-client";

export interface Service {
  id: string;
  provider: string;
  accountEmail: string;
  metadata: Record<string, unknown> | null;
  expiresAt: string | null;
  status: string;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { mcpEndpoints: number };
}

export type OAuthApp = { appGroup: string; clientId: string; redirectUri: string };

/** Loads a project's connected services plus its BYO-OAuth-app registrations
 * (both are shown on the same tab and connecting a service can depend on
 * whether the project already has its own app for that provider's group). */
export function useProjectServices(projectId: string) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cloud, setCloud] = useState(false);
  const [oauthApps, setOauthApps] = useState<OAuthApp[]>([]);
  const [redirectUriTemplate, setRedirectUriTemplate] = useState("");

  const reload = useCallback(async () => {
    setError(null);
    try {
      const [data, appData] = await Promise.all([
        apiGet<{ services: Service[] }>(`/api/projects/${projectId}/services`),
        apiGet<{ cloud: boolean; redirectUriTemplate: string; apps: OAuthApp[] }>(
          `/api/projects/${projectId}/oauth-apps`
        ),
      ]);
      setServices(data.services || []);
      setCloud(appData.cloud);
      setOauthApps(appData.apps || []);
      setRedirectUriTemplate(appData.redirectUriTemplate ?? "");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load services");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { services, setServices, loading, error, cloud, oauthApps, redirectUriTemplate, reload };
}
