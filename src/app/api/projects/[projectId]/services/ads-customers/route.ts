import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-middleware";
import { listAccessibleCustomers } from "@/lib/mcp/google-ads";

// GET /api/projects/[projectId]/services/ads-customers?connectionId=xxx
export async function GET(
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
  const connectionId = searchParams.get("connectionId");
  if (!connectionId) {
    return NextResponse.json({ error: "Missing connectionId" }, { status: 400 });
  }

  const connection = await db.serviceConnection.findUnique({
    where: { id: connectionId },
  });
  if (!connection || connection.projectId !== projectId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const customers = await listAccessibleCustomers(connectionId);
    return NextResponse.json({ customers });
  } catch (err) {
    console.error("[ScopeGate] Failed to list Google Ads customers:", err);
    return NextResponse.json(
      { error: "Failed to list Google Ads accounts" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[projectId]/services/ads-customers
export async function POST(
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

  const body = (await request.json()) as {
    connectionId?: string;
    customerId?: string;
    customerName?: string;
  };
  const { connectionId, customerId, customerName } = body;

  if (!connectionId || !customerId) {
    return NextResponse.json(
      { error: "Missing connectionId or customerId" },
      { status: 400 }
    );
  }

  const connection = await db.serviceConnection.findUnique({
    where: { id: connectionId },
  });
  if (!connection || connection.projectId !== projectId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Check if another connection for this project already tracks the same customer
  const siblings = await db.serviceConnection.findMany({
    where: {
      projectId,
      provider: connection.provider,
      accountEmail: connection.accountEmail,
      id: { not: connectionId },
    },
  });
  const duplicate = siblings.find(
    (c) => (c.metadata as Record<string, unknown> | null)?.googleAdsCustomerId === customerId
  );

  if (duplicate) {
    // Reconnecting an existing account — refresh tokens on the existing record, remove temp
    const dupMeta = duplicate.metadata as Record<string, unknown> | null;
    await db.serviceConnection.update({
      where: { id: duplicate.id },
      data: {
        accessToken: connection.accessToken,
        refreshToken: connection.refreshToken,
        expiresAt: connection.expiresAt,
        status: "active",
        lastError: null,
        metadata: {
          ...(dupMeta ?? {}),
          googleAdsCustomerId: customerId,
          ...(customerName ? { googleAdsCustomerName: customerName } : {}),
        },
      },
    });
    await db.serviceConnection.delete({ where: { id: connectionId } });
  } else {
    const metadata = connection.metadata as Record<string, unknown> | null;
    await db.serviceConnection.update({
      where: { id: connectionId },
      data: {
        metadata: {
          ...(metadata ?? {}),
          googleAdsCustomerId: customerId,
          ...(customerName ? { googleAdsCustomerName: customerName } : {}),
        },
      },
    });
  }

  return NextResponse.json({ success: true });
}
