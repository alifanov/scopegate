import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withProjectAuth } from "@/lib/project-access";
import { listAccessibleCustomers, stripPendingAccountEmail } from "@/lib/mcp/google-ads";

// GET /api/projects/[projectId]/services/ads-customers?connectionId=xxx
export const GET = withProjectAuth<{ projectId: string }>(
  "member",
  async (request, { params: { projectId } }) => {
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
);

// POST /api/projects/[projectId]/services/ads-customers
export const POST = withProjectAuth<{ projectId: string }>(
  "owner",
  async (request, { params: { projectId } }) => {
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

    // accountEmail may still carry the temp-unique "#pending:" suffix (see oauth-callback-config.ts)
    // until finalized below — recover the real account identity for the dedupe lookup.
    const cleanAccountEmail = stripPendingAccountEmail(connection.accountEmail);

    // Check if another connection for this project already tracks the same customer
    const siblings = await db.serviceConnection.findMany({
      where: {
        projectId,
        provider: connection.provider,
        accountEmail: cleanAccountEmail,
        id: { not: connectionId },
      },
    });
    const duplicate = siblings.find(
      (c) => (c.metadata as Record<string, unknown> | null)?.googleAdsCustomerId === customerId
    );

    if (duplicate) {
      // Reconnecting an existing account — refresh tokens on the existing record, remove temp.
      // Atomic: a crash between the two writes would otherwise orphan the temp connection.
      const dupMeta = duplicate.metadata as Record<string, unknown> | null;
      await db.$transaction([
        db.serviceConnection.update({
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
        }),
        db.serviceConnection.delete({ where: { id: connectionId } }),
      ]);
    } else {
      const metadata = connection.metadata as Record<string, unknown> | null;
      await db.serviceConnection.update({
        where: { id: connectionId },
        data: {
          accountEmail: cleanAccountEmail,
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
);
