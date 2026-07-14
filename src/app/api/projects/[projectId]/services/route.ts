import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withProjectAuth } from "@/lib/project-access";
import { revokeProviderToken } from "@/lib/service-revocation";
import { decrypt } from "@/lib/crypto";

// GET /api/projects/[projectId]/services
export const GET = withProjectAuth<{ projectId: string }>(
  "member",
  async (_request, { params: { projectId } }) => {
    const services = await db.serviceConnection.findMany({
      where: { projectId },
      select: {
        id: true,
        provider: true,
        accountEmail: true,
        metadata: true,
        expiresAt: true,
        status: true,
        lastError: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { mcpEndpoints: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ services });
  }
);

// DELETE /api/projects/[projectId]/services?serviceId=xxx
export const DELETE = withProjectAuth<{ projectId: string }>(
  "owner",
  async (request, { params: { projectId } }) => {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("serviceId");
    if (!serviceId) {
      return NextResponse.json(
        { error: "Missing serviceId" },
        { status: 400 }
      );
    }

    // Verify service belongs to this project
    const service = await db.serviceConnection.findUnique({
      where: { id: serviceId },
    });
    if (!service || service.projectId !== projectId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Revoke token with provider before deleting
    try {
      const token = decrypt(service.accessToken);
      await revokeProviderToken(service.provider, token);
    } catch (err) {
      console.warn("[ScopeGate] Token revocation before disconnect failed:", err);
    }

    await db.serviceConnection.delete({ where: { id: serviceId } });

    return NextResponse.json({ success: true });
  }
);
