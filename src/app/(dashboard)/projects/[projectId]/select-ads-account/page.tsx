"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { ApiError, apiGet, apiSend } from "@/lib/api-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { useProject } from "@/components/project/project-context";
import { ServiceIcon } from "@/components/service-icons";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface Customer {
  id: string;
  name: string;
  isManager: boolean;
}

export default function SelectAdsAccountPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setProject } = useProject();

  const connectionId = searchParams.get("connectionId");

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [projectName, setProjectName] = useState<string>("");

  const saveAndRedirect = useCallback(
    async (customerId: string, customerName?: string) => {
      try {
        await apiSend(`/api/projects/${projectId}/services/ads-customers`, "POST", {
          connectionId,
          customerId,
          customerName,
        });
        router.replace(`/projects/${projectId}?tab=services`);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Failed to save account selection");
        setLoading(false);
        setSubmitting(false);
      }
    },
    [projectId, connectionId, router]
  );

  const load = useCallback(async () => {
    try {
      const projectData = await apiGet<{ project: { id: string; name: string } }>(
        `/api/projects/${projectId}`
      );
      setProjectName(projectData.project.name);
      setProject({ projectId: projectData.project.id, projectName: projectData.project.name });
    } catch {
      // Non-critical — breadcrumb project name only
    }

    if (!connectionId) {
      router.replace(`/projects/${projectId}?tab=services&error=oauth_failed`);
      return;
    }

    setError(null);
    try {
      const data = await apiGet<{ customers?: Customer[] }>(
        `/api/projects/${projectId}/services/ads-customers?connectionId=${connectionId}`
      );
      const list: Customer[] = data.customers ?? [];

      if (list.length === 0) {
        toast.error("No Google Ads accounts found");
        router.replace(`/projects/${projectId}?tab=services&error=oauth_failed`);
        return;
      }

      if (list.length === 1) {
        // Auto-select and save if only one account (edge case)
        await saveAndRedirect(list[0].id, list[0].name);
        return;
      }

      setCustomers(list);
      setLoading(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load Google Ads accounts");
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, connectionId, router, saveAndRedirect]);

  useEffect(() => {
    load();
    return () => setProject(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, connectionId]);

  async function handleConnect() {
    if (!selected) return;
    setSubmitting(true);
    const customer = customers.find((c) => c.id === selected);
    await saveAndRedirect(selected, customer?.name);
  }

  async function handleCancel() {
    if (!connectionId) {
      router.replace(`/projects/${projectId}?tab=services`);
      return;
    }
    setCancelling(true);
    try {
      await apiSend(`/api/projects/${projectId}/services?serviceId=${connectionId}`, "DELETE");
    } catch {
      // Ignore errors on cancel
    }
    router.replace(`/projects/${projectId}?tab=services`);
  }

  if (loading) {
    return (
      <div className="max-w-2xl space-y-6">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-8 w-64" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl space-y-6">
        <Breadcrumbs
          items={[
            { label: "Projects", href: "/projects" },
            { label: projectName || "Project", href: `/projects/${projectId}` },
            { label: "Select Google Ads Account" },
          ]}
        />
        <div className="space-y-3">
          <p className="text-destructive">{error}</p>
          <Button variant="outline" onClick={load} className="cursor-pointer">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Breadcrumbs
        items={[
          { label: "Projects", href: "/projects" },
          { label: projectName || "Project", href: `/projects/${projectId}` },
          { label: "Select Google Ads Account" },
        ]}
      />

      <div className="flex items-center gap-3">
        <ServiceIcon provider="googleAds" className="size-8 shrink-0" />
        <div>
          <h1 className="text-2xl font-bold">Select Google Ads Account</h1>
          <p className="text-sm text-muted-foreground">
            Choose which account to connect to this project
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Accounts</CardTitle>
          <CardDescription>
            {customers.length} account{customers.length !== 1 ? "s" : ""} found on your Google account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {customers.map((customer) => (
            <button
              key={customer.id}
              onClick={() => setSelected(customer.id)}
              className={`flex w-full items-center gap-4 rounded-lg border p-4 text-left transition-colors hover:bg-muted ${
                selected === customer.id
                  ? "border-primary bg-primary/5"
                  : "border-border"
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{customer.name}</span>
                  {customer.isManager && (
                    <Badge variant="secondary" className="text-xs">
                      Manager
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">ID: {customer.id}</p>
              </div>
              {selected === customer.id && (
                <CheckCircle2 className="size-5 shrink-0 text-primary" />
              )}
            </button>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={submitting || cancelling}
        >
          <ArrowLeft className="size-4" />
          {cancelling ? "Cancelling..." : "Cancel"}
        </Button>
        <Button
          onClick={handleConnect}
          disabled={!selected || submitting || cancelling}
        >
          {submitting ? "Connecting..." : "Connect"}
        </Button>
      </div>
    </div>
  );
}
