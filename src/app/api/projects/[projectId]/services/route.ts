import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authErrorResponse, requireCurrentUser } from "@/lib/auth-middleware";
import { requireProjectMember, requireProjectOwner } from "@/lib/project-auth";
import { revokeGoogleToken } from "@/lib/google-oauth";
import { revokeLinkedInToken } from "@/lib/linkedin-oauth";
import { decrypt } from "@/lib/crypto";

// GET /api/projects/[projectId]/services
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  let projectId: string;
  try {
    const user = await requireCurrentUser();
    ({ projectId } = await params);
    await requireProjectMember(user.userId, projectId);
  } catch (error) {
    return authErrorResponse(error);
  }

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

// DELETE /api/projects/[projectId]/services?serviceId=xxx
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  let projectId: string;
  try {
    const user = await requireCurrentUser();
    ({ projectId } = await params);
    await requireProjectOwner(user.userId, projectId);
  } catch (error) {
    return authErrorResponse(error);
  }

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
    const googleProviders = new Set(["gmail", "calendar", "drive", "googleAds", "searchConsole"]);
    if (googleProviders.has(service.provider)) {
      await revokeGoogleToken(token);
    } else if (service.provider === "linkedin") {
      await revokeLinkedInToken();
    }
  } catch (err) {
    console.warn("[ScopeGate] Token revocation before disconnect failed:", err);
  }

  await db.serviceConnection.delete({ where: { id: serviceId } });

  return NextResponse.json({ success: true });
}
