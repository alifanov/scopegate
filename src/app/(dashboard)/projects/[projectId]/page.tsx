"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EndpointsTab } from "@/components/project/endpoints-tab";
import { ServicesTab } from "@/components/project/services-tab";
import { AuditTab } from "@/components/project/audit-tab";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { useProject } from "@/components/project/project-context";
import { TabContentSkeleton } from "@/components/skeletons";
import { Settings } from "lucide-react";
import { apiGet, ApiError } from "@/lib/api-client";

interface ProjectDetails {
  id: string;
  name: string;
}

export default function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setProject } = useProject();
  const [project, setProjectLocal] = useState<ProjectDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentTab = searchParams.get("tab") || "endpoints";

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<{ project: ProjectDetails }>(`/api/projects/${projectId}`);
      setProjectLocal(data.project);
      setProject({ projectId: data.project.id, projectName: data.project.name });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load project");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    return () => setProject(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  function handleTabChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`/projects/${projectId}?${params.toString()}`);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <TabContentSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">{error}</p>
        <Button onClick={load}>Retry</Button>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Projects", href: "/projects" },
          { label: project.name },
        ]}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <Button variant="outline" asChild>
          <Link href={`/projects/${projectId}/settings`}><Settings className="size-4" />Settings</Link>
        </Button>
      </div>

      <Tabs value={currentTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="endpoints">MCP Endpoints</TabsTrigger>
          <TabsTrigger value="services">Auth Connections</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="endpoints" className="mt-4">
          <EndpointsTab projectId={projectId} />
        </TabsContent>
        <TabsContent value="services" className="mt-4">
          <ServicesTab projectId={projectId} />
        </TabsContent>
        <TabsContent value="logs" className="mt-4">
          <AuditTab projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
