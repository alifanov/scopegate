"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ManageMembers } from "@/components/project/manage-members";
import { TableSkeleton } from "@/components/skeletons";
import { Users } from "lucide-react";
import { toast } from "sonner";

interface Member {
  id: string;
  role: string;
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

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      } else if (res.status === 403) {
        toast.error("You do not have admin access");
      }
    } catch {
      toast.error("Failed to load projects");
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
      ) : projects.length === 0 ? (
        <p className="text-muted-foreground">No projects found.</p>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => {
            const owner = project.teamMembers.find((m) => m.role === "owner");
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
