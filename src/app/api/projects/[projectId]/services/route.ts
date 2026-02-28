import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-middleware";
import { revokeGoogleToken } from "@/lib/google-oauth";
import { revokeLinkedInToken } from "@/lib/linkedin-oauth";
import { decrypt } from "@/lib/crypto";

// GET /api/projects/[projectId]/services
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const member = await db.teamMember.findUnique({
    where: { userId_projectId: { userId: user.userId, projectId } },
  });
  if (!member) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const member = await db.teamMember.findUnique({
    where: { userId_projectId: { userId: user.userId, projectId } },
  });
  if (!member) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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
      await revokeLinkedInToken(token);
    }
  } catch (err) {
    console.warn("[ScopeGate] Token revocation before disconnect failed:", err);
  }

  await db.serviceConnection.delete({ where: { id: serviceId } });

  return NextResponse.json({ success: true });
}
