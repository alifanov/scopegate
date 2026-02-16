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

  const currentTab = searchParams.get("tab") || "endpoints";

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setProjectLocal(data.project);
        setProject({ projectId: data.project.id, projectName: data.project.name });
      }
      setLoading(false);
    }
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

  if (!project) return <p className="text-destructive">Project not found</p>;

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
          <Link href={`/projects/${projectId}/settings`}>Settings</Link>
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
