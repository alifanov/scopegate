"use client";

import { useEffect, useState, useCallback } from "react";
import { ApiError, apiGet } from "@/lib/api-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ManageMembers } from "@/components/project/manage-members";
import { TableSkeleton } from "@/components/skeletons";
import type { ProjectRole } from "@/generated/prisma/client";
import { isProjectOwner } from "@/lib/project-roles";
import { Users } from "lucide-react";

interface Member {
  id: string;
  role: ProjectRole;
  user: { id: string; email: string; name: string | null };
}

interface Project {
  id: string;
  name: string;
  createdAt: string;
  teamMembers: Member[];
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      const data = await apiGet<{ projects: Project[] }>("/api/admin/projects");
      setProjects(data.projects || []);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Admin: Projects" }]} />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projects</h1>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : error ? (
        <div className="space-y-3">
          <p className="text-destructive">{error}</p>
          <Button variant="outline" onClick={fetchProjects} className="cursor-pointer">
            Retry
          </Button>
        </div>
      ) : projects.length === 0 ? (
        <p className="text-muted-foreground">No projects found.</p>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => {
            const owner = project.teamMembers.find((m) =>
              isProjectOwner(m.role)
            );
            return (
              <Card key={project.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    {project.name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <Users className="size-3" />
                    {project.teamMembers.length} member
                    {project.teamMembers.length !== 1 ? "s" : ""}
                    {owner && (
                      <span className="ml-2">
                        · Owner: {owner.user.name || owner.user.email}
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ManageMembers
                    projectId={project.id}
                    members={project.teamMembers}
                    onChanged={fetchProjects}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
