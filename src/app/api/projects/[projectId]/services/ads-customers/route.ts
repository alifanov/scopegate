import { NextResponse } from "next/server";
import { withProjectAuth, requireProjectServiceConnection } from "@/lib/project-access";
import { listAccessibleCustomers } from "@/lib/mcp/google-ads";
import { reconcileAdsCustomer } from "@/lib/ads-reconciliation";

// GET /api/projects/[projectId]/services/ads-customers?connectionId=xxx
export const GET = withProjectAuth<{ projectId: string }>(
  "member",
  async (request, { params: { projectId } }) => {
    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get("connectionId");
    if (!connectionId) {
      return NextResponse.json({ error: "Missing connectionId" }, { status: 400 });
    }

    await requireProjectServiceConnection(projectId, connectionId);

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

    const connection = await requireProjectServiceConnection(projectId, connectionId);

    await reconcileAdsCustomer(connection, customerId, customerName);

    return NextResponse.json({ success: true });
  }
);
