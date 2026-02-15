"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProjectDetails {
  id: string;
  name: string;
  createdAt: string;
  _count: { mcpEndpoints: number };
  serviceConnections: {
    id: string;
    provider: string;
    accountEmail: string;
    createdAt: string;
  }[];
  teamMembers: {
    id: string;
    role: string;
    user: { id: string; email: string; name: string | null };
  }[];
}

export default function ProjectOverviewPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data.project);
      }
      setLoading(false);
    }
    load();
  }, [projectId]);

  if (loading) return <p className="text-muted-foreground">Loading...</p>;
  if (!project) return <p className="text-destructive">Project not found</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/projects/${projectId}/settings`}>Settings</Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="quick-links">Quick Links</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardDescription>MCP Endpoints</CardDescription>
                <CardTitle className="text-3xl">
                  {project._count.mcpEndpoints}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Connected Services</CardDescription>
                <CardTitle className="text-3xl">
                  {project.serviceConnections.length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Team Members</CardDescription>
                <CardTitle className="text-3xl">
                  {project.teamMembers.length}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {project.serviceConnections.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Connected Services</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {project.serviceConnections.map((sc) => (
                    <div
                      key={sc.id}
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <div>
                        <p className="font-medium capitalize">{sc.provider}</p>
                        <p className="text-sm text-muted-foreground">
                          {sc.accountEmail}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="quick-links" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Endpoints</CardTitle>
                <CardDescription>Manage MCP endpoints</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href={`/projects/${projectId}/endpoints`}>
                    View Endpoints
                  </Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Services</CardTitle>
                <CardDescription>Connected external services</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href={`/projects/${projectId}/services`}>
                    View Services
                  </Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Audit Log</CardTitle>
                <CardDescription>View request history</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href={`/projects/${projectId}/audit`}>
                    View Logs
                  </Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
                <CardDescription>Project &amp; team settings</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href={`/projects/${projectId}/settings`}>
                    Open Settings
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
